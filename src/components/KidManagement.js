import React, { useState, useEffect } from 'react';
import { db } from '../config/firebase';
import { useAuth } from '../context/AuthContext';
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  query,
  where,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import '../styles/kidManagement.css';

const AGE_GROUPS = [
  { value: '2-4', label: 'Age 2-4 years' },
  { value: '4+', label: 'Age 4+ years' },
  { value: '8+', label: 'Age 8+ years' },
];

function KidManagement() {
  const { currentUser } = useAuth();
  const [kids, setKids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [ageGroup, setAgeGroup] = useState('2-4');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Fetch kids from Firestore
  useEffect(() => {
    if (!currentUser) return;

    setLoading(true);
    const q = query(
      collection(db, 'parents', currentUser.uid, 'kids'),
      where('parentId', '==', currentUser.uid)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const kidsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setKids(kidsData);
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching kids:', error);
        setError('Failed to load kids');
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [currentUser]);

  // Add kid
  const handleAddKid = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!name.trim()) {
      setError('Please enter your child\'s name');
      return;
    }

    try {
      await addDoc(collection(db, 'parents', currentUser.uid, 'kids'), {
        name: name.trim(),
        ageGroup,
        parentId: currentUser.uid,
        createdAt: serverTimestamp(),
      });

      setSuccess(`${name} added successfully! 🎉`);
      setName('');
      setAgeGroup('2-4');

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to add child. Please try again.');
      console.error('Error adding kid:', err);
    }
  };

  // Delete kid
  const handleDeleteKid = async (kidId) => {
    if (!window.confirm('Are you sure you want to remove this child?')) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'parents', currentUser.uid, 'kids', kidId));
      setSuccess('Child removed successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to delete child. Please try again.');
      console.error('Error deleting kid:', err);
    }
  };

  const ageGroupLabel = (group) => {
    return AGE_GROUPS.find((g) => g.value === group)?.label || group;
  };

  return (
    <div className="kid-management">
      <div className="kid-management-content">
        {/* Add Kid Form Section */}
        <div className="add-kid-section">
          <h2>👨‍👩‍👧 Add Your Child</h2>
          <form onSubmit={handleAddKid} className="add-kid-form">
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="kid-name">Child's Name:</label>
                <input
                  id="kid-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter name"
                  maxLength="50"
                />
              </div>

              <div className="form-group">
                <label htmlFor="age-group">Age Group:</label>
                <select
                  id="age-group"
                  value={ageGroup}
                  onChange={(e) => setAgeGroup(e.target.value)}
                >
                  {AGE_GROUPS.map((group) => (
                    <option key={group.value} value={group.value}>
                      {group.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group-button">
                <button type="submit" className="add-btn">
                  + Add Child
                </button>
              </div>
            </div>
          </form>

          {/* Messages */}
          {error && <div className="message error-message">{error}</div>}
          {success && <div className="message success-message">{success}</div>}
        </div>

        {/* Kids List Section */}
        <div className="kids-list-section">
          <h2>🌟 Your Children</h2>

          {loading ? (
            <p className="loading">Loading your children...</p>
          ) : kids.length === 0 ? (
            <p className="empty-state">
              No children added yet. Add your first child above! 👶
            </p>
          ) : (
            <div className="kids-grid">
              {kids.map((kid) => (
                <div key={kid.id} className="kid-card">
                  <div className="kid-card-header">
                    <h3>{kid.name}</h3>
                    <button
                      onClick={() => handleDeleteKid(kid.id)}
                      className="delete-btn"
                      title="Delete child"
                      aria-label={`Delete ${kid.name}`}
                    >
                      ✕
                    </button>
                  </div>

                  <div className="kid-card-body">
                    <div className="age-badge">
                      <span className="age-label">Age Group:</span>
                      <span className="age-value">{ageGroupLabel(kid.ageGroup)}</span>
                    </div>
                  </div>

                  <div className="kid-card-footer">
                    <p className="created-text">
                      Added {new Date(kid.createdAt?.toDate()).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default KidManagement;
