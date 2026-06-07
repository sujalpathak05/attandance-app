import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { FiPlus, FiEdit2, FiTrash2, FiX, FiMapPin, FiTarget } from 'react-icons/fi';

const emptyForm = { name: '', address: '', lat: '', lng: '', radius: 50 };

export default function Locations() {
  const [locations, setLocations] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [detecting, setDetecting] = useState(false);

  const fetch = () => api.get('/admin/locations').then(r => setLocations(r.data));
  useEffect(() => { fetch(); }, []);

  const openAdd = () => { setEditing(null); setForm(emptyForm); setShowModal(true); };
  const openEdit = (loc) => {
    setEditing(loc._id);
    setForm({ name: loc.name, address: loc.address || '', lat: loc.lat, lng: loc.lng, radius: loc.radius });
    setShowModal(true);
  };

  const detectLocation = () => {
    setDetecting(true);
    navigator.geolocation.getCurrentPosition(
      pos => {
        setForm(f => ({ ...f, lat: pos.coords.latitude.toFixed(6), lng: pos.coords.longitude.toFixed(6) }));
        setDetecting(false);
        toast.success('Current location detected!');
      },
      () => {
        toast.error('Could not detect location. Enable location permission.');
        setDetecting(false);
      }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = { ...form, lat: parseFloat(form.lat), lng: parseFloat(form.lng), radius: Number(form.radius) };
      if (editing) {
        await api.put(`/admin/locations/${editing}`, payload);
        toast.success('Location updated!');
      } else {
        await api.post('/admin/locations', payload);
        toast.success('Location added!');
      }
      setShowModal(false);
      fetch();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this location?')) return;
    try {
      await api.delete(`/admin/locations/${id}`);
      toast.success('Location deleted');
      fetch();
    } catch {
      toast.error('Error deleting location');
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Office Locations</h1>
        <button onClick={openAdd} className="btn-primary flex items-center gap-2">
          <FiPlus size={16} /> Add Location
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {locations.length === 0 ? (
          <div className="card col-span-3 text-center py-10 text-gray-400">
            <FiMapPin size={40} className="mx-auto mb-3 opacity-30" />
            <p>No locations added yet</p>
          </div>
        ) : locations.map(loc => (
          <div key={loc._id} className="card hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
                  <FiMapPin size={18} />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800">{loc.name}</h3>
                  {loc.address && <p className="text-xs text-gray-400 mt-0.5">{loc.address}</p>}
                </div>
              </div>
              <div className="flex gap-1">
                <button onClick={() => openEdit(loc)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg">
                  <FiEdit2 size={14} />
                </button>
                <button onClick={() => handleDelete(loc._id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg">
                  <FiTrash2 size={14} />
                </button>
              </div>
            </div>
            <div className="mt-4 space-y-2 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <FiTarget size={14} className="text-gray-400" />
                <span>Lat: {loc.lat}, Lng: {loc.lng}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                  Radius: {loc.radius}m
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <FiMapPin /> {editing ? 'Edit Location' : 'Add Location'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <FiX size={22} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location Name *</label>
                <input className="input-field" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g., Head Office" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <input className="input-field" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} placeholder="Full address" />
              </div>

              <div className="flex gap-2 items-end">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Latitude *</label>
                  <input type="number" step="any" className="input-field" value={form.lat} onChange={e => setForm(f => ({ ...f, lat: e.target.value }))} placeholder="e.g., 28.6139" required />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Longitude *</label>
                  <input type="number" step="any" className="input-field" value={form.lng} onChange={e => setForm(f => ({ ...f, lng: e.target.value }))} placeholder="e.g., 77.2090" required />
                </div>
                <button type="button" onClick={detectLocation} disabled={detecting}
                  className="btn-secondary text-xs px-3 py-2 mb-0 whitespace-nowrap flex items-center gap-1">
                  <FiTarget size={14} /> {detecting ? '...' : 'Detect'}
                </button>
              </div>
              <p className="text-xs text-gray-400">Click "Detect" to use your current location as coordinates.</p>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Allowed Radius (meters)</label>
                <input type="number" className="input-field" value={form.radius} onChange={e => setForm(f => ({ ...f, radius: e.target.value }))} min="10" max="5000" />
                <p className="text-xs text-gray-400 mt-1">Employee must be within this distance to punch in/out.</p>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={loading} className="btn-primary flex-1">
                  {loading ? 'Saving...' : editing ? 'Update Location' : 'Add Location'}
                </button>
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary px-6">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
