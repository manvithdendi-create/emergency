import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { UserPlus, Phone, Mail, User, Trash2, Edit, Check, X, Save, Loader2 } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../services/supabase'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { Card, CardBody } from '../../components/ui/Card'
import { Modal, ConfirmModal } from '../../components/ui/Modal'
import { toast } from '../../hooks/useToast'
import { cn, validatePhone, formatPhone } from '../../utils/helpers'
import type { EmergencyContact } from '../../types'
import { DEMO_CONTACTS } from '../../services/mockData'

const LOCAL_CONTACTS_KEY = 'emergency_patient_contacts'

const contactSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  relationship: z.string().min(1, 'Please select a relationship'),
  phone: z.string().refine(validatePhone, 'Invalid phone number'),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  is_primary: z.boolean().default(false),
})

type ContactForm = z.infer<typeof contactSchema>

const relationships = [
  { value: 'spouse', label: 'Spouse' },
  { value: 'parent', label: 'Parent' },
  { value: 'child', label: 'Child' },
  { value: 'sibling', label: 'Sibling' },
  { value: 'relative', label: 'Relative' },
  { value: 'friend', label: 'Friend' },
  { value: 'caregiver', label: 'Caregiver' },
  { value: 'other', label: 'Other' },
]

export function PatientEmergencyContacts() {
  const { authUser } = useAuth()
  const [contacts, setContacts] = useState<EmergencyContact[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingContact, setEditingContact] = useState<EmergencyContact | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<EmergencyContact | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<ContactForm>({
    resolver: zodResolver(contactSchema),
  })

  useEffect(() => {
    fetchContacts()
  }, [])

  const fetchContacts = async () => {
    try {
      if (authUser?.profile?.id) {
        const { data, error } = await supabase
          .from('emergency_contacts')
          .select('*')
          .eq('patient_id', authUser.profile.id)
          .order('is_primary', { ascending: false })
          .order('created_at', { ascending: true })

        if (!error && data && data.length > 0) {
          setContacts(data)
          setLoading(false)
          return
        }
      }
    } catch (error) {
      console.warn('Supabase fetch failed, loading local contacts:', error)
    }

    try {
      const stored = localStorage.getItem(LOCAL_CONTACTS_KEY)
      if (stored) {
        setContacts(JSON.parse(stored))
        setLoading(false)
        return
      }
    } catch (e) {
      console.warn('Could not read contacts from localStorage', e)
    }

    setContacts(DEMO_CONTACTS)
    setLoading(false)
  }

  const openModal = (contact?: EmergencyContact) => {
    if (contact) {
      setEditingContact(contact)
      reset({
        name: contact.name,
        relationship: contact.relationship,
        phone: contact.phone,
        email: contact.email || '',
        is_primary: contact.is_primary,
      })
    } else {
      setEditingContact(null)
      reset({ is_primary: false })
    }
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setEditingContact(null)
  }

  const onSubmit = async (data: ContactForm) => {
    setSaving(true)
    try {
      const payload: EmergencyContact = {
        id: editingContact ? editingContact.id : 'contact-' + Date.now(),
        patient_id: authUser?.profile?.id || 'prof-patient-001',
        name: data.name,
        relationship: data.relationship,
        phone: data.phone,
        email: data.email || undefined,
        is_primary: data.is_primary,
        created_at: editingContact ? editingContact.created_at : new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      try {
        if (editingContact) {
          await supabase.from('emergency_contacts').update(payload).eq('id', editingContact.id)
        } else {
          await supabase.from('emergency_contacts').insert(payload)
        }
      } catch (dbErr) {
        console.warn('Supabase contact notice:', dbErr)
      }

      const updated = editingContact
        ? contacts.map(c => c.id === editingContact.id ? payload : c)
        : [payload, ...contacts]

      setContacts(updated)
      try {
        localStorage.setItem(LOCAL_CONTACTS_KEY, JSON.stringify(updated))
      } catch (e) {}

      toast.success(editingContact ? 'Contact updated' : 'Contact added')
      closeModal()
    } catch (error) {
      toast.error('Failed to save contact')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (contact: EmergencyContact) => {
    try {
      try {
        await supabase.from('emergency_contacts').delete().eq('id', contact.id)
      } catch {}
      const updated = contacts.filter(c => c.id !== contact.id)
      setContacts(updated)
      try {
        localStorage.setItem(LOCAL_CONTACTS_KEY, JSON.stringify(updated))
      } catch (e) {}
      toast.success('Contact deleted')
    } catch (error) {
      toast.error('Failed to delete contact')
    }
    setDeleteConfirm(null)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 text-emergency-blue animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Emergency Contacts</h1>
          <p className="text-gray-600">Manage your emergency contact list</p>
        </div>
        <Button onClick={() => openModal()}>
          <UserPlus className="w-4 h-4 mr-2" />
          Add Contact
        </Button>
      </div>

      {contacts.length === 0 ? (
        <Card>
          <CardBody className="py-12 text-center">
            <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No emergency contacts yet</h3>
            <p className="text-gray-500 mb-6">Add contacts who should be notified in an emergency</p>
            <Button onClick={() => openModal()}>
              <UserPlus className="w-4 h-4 mr-2" />
              Add First Contact
            </Button>
          </CardBody>
        </Card>
      ) : (
        <div className="space-y-4">
          {contacts.map((contact) => (
            <Card key={contact.id} className={contact.is_primary ? 'ring-2 ring-emergency-blue' : ''}>
              <CardBody>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-emergency-blue-light flex items-center justify-center">
                      <User className="w-6 h-6 text-emergency-blue" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-gray-900">{contact.name}</h3>
                        {contact.is_primary && (
                          <span className="badge bg-emergency-blue-light text-emergency-blue-dark text-xs">
                            Primary
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 capitalize">{contact.relationship}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <a href={`tel:${contact.phone}`} className="text-gray-600 hover:text-gray-900 flex items-center gap-1">
                      <Phone className="w-4 h-4" />
                      <span>{formatPhone(contact.phone)}</span>
                    </a>
                    {contact.email && (
                      <a href={`mailto:${contact.email}`} className="text-gray-600 hover:text-gray-900 flex items-center gap-1">
                        <Mail className="w-4 h-4" />
                        <span>{contact.email}</span>
                      </a>
                    )}
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" onClick={() => openModal(contact)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setDeleteConfirm(contact)}>
                        <Trash2 className="w-4 h-4 text-emergency-red" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={closeModal} title={editingContact ? 'Edit Contact' : 'Add Emergency Contact'} size="md">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Full Name"
            {...register('name')}
            error={errors.name?.message}
            required
          >
            <User className="w-5 h-5 text-gray-400" />
          </Input>
          <Select
            label="Relationship"
            options={relationships}
            placeholder="Select relationship"
            {...register('relationship')}
            error={errors.relationship?.message}
            required
          >
            <User className="w-5 h-5 text-gray-400" />
          </Select>
          <Input
            label="Phone Number"
            type="tel"
            {...register('phone')}
            error={errors.phone?.message}
            required
            placeholder="(555) 123-4567"
          >
            <Phone className="w-5 h-5 text-gray-400" />
          </Input>
          <Input
            label="Email (optional)"
            type="email"
            {...register('email')}
            error={errors.email?.message}
            placeholder="contact@example.com"
          >
            <Mail className="w-5 h-5 text-gray-400" />
          </Input>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              {...register('is_primary')}
              className="w-4 h-4 rounded border-gray-300 text-emergency-blue focus:ring-emergency-blue"
            />
            <span className="text-sm text-gray-700">Set as primary contact</span>
          </label>
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={closeModal}>
              Cancel
            </Button>
            <Button type="submit" loading={saving}>
              {editingContact ? 'Update' : 'Add'} Contact
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={() => deleteConfirm && handleDelete(deleteConfirm)}
        title="Delete Contact"
        message={`Are you sure you want to delete ${deleteConfirm?.name} from your emergency contacts?`}
        confirmText="Delete"
        variant="danger"
      />
    </div>
  )
}