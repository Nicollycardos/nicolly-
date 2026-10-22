import React, { useState } from 'react';
import {
  Users,
  Plus,
  Search,
  Filter,
  Phone,
  Mail,
  MapPin,
  Building2,
  Edit2,
  Trash2,
  AlertTriangle,
  UserCheck
} from 'lucide-react';
import { Contact, ContactType } from '../types/erp.js';
import { Modal } from './Modal.js';

interface ContactsManagerProps {
  contacts: Contact[];
  onSaveContact: (contact: Partial<Contact>) => Promise<void>;
  onDeleteContact: (id: string) => Promise<void>;
}

export const ContactsManager: React.FC<ContactsManagerProps> = ({
  contacts,
  onSaveContact,
  onDeleteContact
}) => {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'todos' | ContactType>('todos');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [type, setType] = useState<ContactType>('cliente');
  const [document, setDocument] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState('');

  const openNewModal = () => {
    setEditingContact(null);
    setName('');
    setType('cliente');
    setDocument('');
    setEmail('');
    setPhone('');
    setCity('');
    setAddress('');
    setNotes('');
    setFormError('');
    setIsModalOpen(true);
  };

  const openEditModal = (c: Contact) => {
    setEditingContact(c);
    setName(c.name);
    setType(c.type);
    setDocument(c.document);
    setEmail(c.email);
    setPhone(c.phone);
    setCity(c.city);
    setAddress(c.address);
    setNotes(c.notes || '');
    setFormError('');
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setFormError('O nome ou razão social é obrigatório.');
      return;
    }

    try {
      await onSaveContact({
        ...(editingContact ? { id: editingContact.id } : {}),
        name: name.trim(),
        type,
        document: document.trim(),
        email: email.trim(),
        phone: phone.trim(),
        city: city.trim(),
        address: address.trim(),
        notes: notes.trim()
      });
      setIsModalOpen(false);
    } catch (err: any) {
      setFormError(err.message || 'Erro ao salvar contato');
    }
  };

  const filteredContacts = contacts.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.document.toLowerCase().includes(search.toLowerCase()) ||
      c.city.toLowerCase().includes(search.toLowerCase());
    const matchesType =
      typeFilter === 'todos' ? true : c.type === typeFilter || c.type === 'ambos';
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center">
            <Users className="h-6 w-6 text-blue-600 mr-2" />
            Cadastro de Clientes & Fornecedores
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Registro comercial de parceiros, compradores e distribuidores de insumos.
          </p>
        </div>

        <button
          onClick={openNewModal}
          className="flex items-center justify-center space-x-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg shadow-sm transition"
        >
          <Plus className="h-4 w-4" />
          <span>Cadastrar Parceiro</span>
        </button>
      </div>

      {/* Filter and Search */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por nome, documento ou cidade..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <Filter className="h-4 w-4 text-slate-400 hidden sm:inline" />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as any)}
            className="px-3 py-2 border border-slate-300 rounded-lg text-xs sm:text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="todos">Todos os Registros</option>
            <option value="cliente">Apenas Clientes</option>
            <option value="fornecedor">Apenas Fornecedores</option>
            <option value="ambos">Cliente e Fornecedor</option>
          </select>
        </div>
      </div>

      {/* Contacts Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredContacts.length === 0 ? (
          <div className="col-span-full bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400">
            <Users className="h-10 w-10 mx-auto text-slate-300 mb-2" />
            <p className="text-sm font-medium">Nenhum cliente ou fornecedor encontrado.</p>
          </div>
        ) : (
          filteredContacts.map((contact) => (
            <div
              key={contact.id}
              className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:border-slate-300 transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold ${
                      contact.type === 'cliente'
                        ? 'bg-blue-100 text-blue-800'
                        : contact.type === 'fornecedor'
                        ? 'bg-purple-100 text-purple-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {contact.type === 'cliente'
                      ? 'Cliente'
                      : contact.type === 'fornecedor'
                      ? 'Fornecedor'
                      : 'Cliente & Fornecedor'}
                  </span>

                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => openEditModal(contact)}
                      className="p-1 text-slate-400 hover:text-blue-600 rounded transition"
                      title="Editar"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Deseja remover "${contact.name}"?`)) {
                          onDeleteContact(contact.id);
                        }
                      }}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded transition"
                      title="Excluir"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                <h3 className="font-bold text-base text-slate-900 mt-2">{contact.name}</h3>
                {contact.document && (
                  <p className="text-xs text-slate-500 font-mono mt-0.5">Doc: {contact.document}</p>
                )}

                <div className="mt-3 space-y-1.5 text-xs text-slate-600">
                  {contact.phone && (
                    <div className="flex items-center">
                      <Phone className="h-3.5 w-3.5 mr-2 text-slate-400 shrink-0" />
                      <span>{contact.phone}</span>
                    </div>
                  )}
                  {contact.email && (
                    <div className="flex items-center">
                      <Mail className="h-3.5 w-3.5 mr-2 text-slate-400 shrink-0" />
                      <span className="truncate">{contact.email}</span>
                    </div>
                  )}
                  {contact.city && (
                    <div className="flex items-center">
                      <MapPin className="h-3.5 w-3.5 mr-2 text-slate-400 shrink-0" />
                      <span>{contact.city}</span>
                    </div>
                  )}
                </div>
              </div>

              {contact.notes && (
                <div className="mt-3 pt-2.5 border-t border-slate-100 text-[11px] text-slate-500 italic">
                  {contact.notes}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Modal Cadastro/Edição */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingContact ? 'Editar Cadastro' : 'Novo Cliente ou Fornecedor'}
        subtitle="Dados de contato, identificação fiscal e classificação."
      >
        <form onSubmit={handleFormSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg flex items-center space-x-2">
              <AlertTriangle className="h-4 w-4 shrink-0 text-rose-500" />
              <span>{formError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Razão Social / Nome Completo *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Madeireira São Paulo Ltda, João da Silva..."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Classificação *
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as ContactType)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="cliente">Cliente</option>
                <option value="fornecedor">Fornecedor</option>
                <option value="ambos">Cliente & Fornecedor</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                CNPJ ou CPF
              </label>
              <input
                type="text"
                value={document}
                onChange={(e) => setDocument(e.target.value)}
                placeholder="00.000.000/0000-00"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Telefone / WhatsApp
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(00) 00000-0000"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                E-mail
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="contato@empresa.com"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Cidade / UF
              </label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Ex: São Paulo - SP"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Endereço
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Rua, Número, Bairro..."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Observações Comerciais
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Condições de pagamento, prazos de entrega, etc..."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div className="pt-3 flex items-center justify-end space-x-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 border border-slate-300 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg shadow-sm"
            >
              {editingContact ? 'Salvar Contato' : 'Cadastrar'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
