import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  addContent,
  getContent,
  deleteContent,
  uploadAudioFile,
  uploadRecordedAudio
} from '../services/contentService';
import { getSeedContent } from '../utils/seedContent';
import '../styles/contentManagement.css';

const AGE_GROUPS = ['2-4', '4+', '8+'];
const CATEGORIES = ['words', 'phrases'];

export default function ContentManagement() {
  const { currentUser, isSuperAdmin } = useAuth();
  const [contentList, setContentList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  // Form state
  const [teluguText, setTeluguText] = useState('');
  const [englishTranslation, setEnglishTranslation] = useState('');
  const [ageGroup, setAgeGroup] = useState('2-4');
  const [category, setCategory] = useState('words');
  const [audioFile, setAudioFile] = useState(null);
  const [audioUrl, setAudioUrl] = useState('');
  const [uploading, setUploading] = useState(false);

  // Audio recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  // Filter state
  const [filterAgeGroup, setFilterAgeGroup] = useState('');

  // Load content
  useEffect(() => {
    loadContent();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterAgeGroup]);

  async function loadContent() {
    try {
      setLoading(true);
      const content = await getContent(
        currentUser.uid,
        filterAgeGroup || null,
        isSuperAdmin
      );
      setContentList(content);
      setError('');
    } catch (err) {
      setError('Failed to load content');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  // Handle form submission
  async function handleSubmit(e) {
    e.preventDefault();

    if (!teluguText || !englishTranslation) {
      setError('Telugu text and English translation are required');
      return;
    }

    try {
      setUploading(true);
      setError('');
      setMessage('');

      let finalAudioUrl = audioUrl;

      // Upload audio file if provided
      if (audioFile) {
        const tempId = `temp_${Date.now()}`;
        finalAudioUrl = await uploadAudioFile(audioFile, tempId);
      } else if (recordedBlob) {
        const tempId = `temp_${Date.now()}`;
        finalAudioUrl = await uploadRecordedAudio(recordedBlob, tempId);
      }

      const contentData = {
        teluguText,
        englishTranslation,
        ageGroup,
        category,
        audioUrl: finalAudioUrl
      };

      await addContent(contentData, currentUser.uid, isSuperAdmin);

      setMessage(isSuperAdmin ? 'Pre-loaded content added successfully!' : 'Content added successfully!');

      // Reset form
      setTeluguText('');
      setEnglishTranslation('');
      setAgeGroup('2-4');
      setCategory('words');
      setAudioFile(null);
      setAudioUrl('');
      setRecordedBlob(null);

      // Reload content
      await loadContent();

      // Clear message after 3 seconds
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setError('Failed to add content: ' + err.message);
      console.error(err);
    } finally {
      setUploading(false);
    }
  }

  // Handle file upload
  function handleFileChange(e) {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('audio/')) {
        setError('Please select an audio file');
        return;
      }
      setAudioFile(file);
      setRecordedBlob(null); // Clear recorded audio if file is uploaded
      setError('');
    }
  }

  // Start recording
  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setRecordedBlob(audioBlob);
        setAudioFile(null); // Clear file upload if recording is used

        // Stop all tracks to release microphone
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      setError('');
    } catch (err) {
      setError('Failed to access microphone: ' + err.message);
      console.error(err);
    }
  }

  // Stop recording
  function stopRecording() {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  }

  // Delete content
  async function handleDelete(contentId, audioUrl) {
    if (!window.confirm('Are you sure you want to delete this content?')) {
      return;
    }

    try {
      await deleteContent(contentId, audioUrl);
      setMessage('Content deleted successfully');
      await loadContent();
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setError('Failed to delete content: ' + err.message);
      console.error(err);
    }
  }

  // Play audio
  function playAudio(url) {
    if (url) {
      const audio = new Audio(url);
      audio.play().catch(err => {
        setError('Failed to play audio: ' + err.message);
      });
    }
  }

  // Play recorded audio preview
  function playRecordedPreview() {
    if (recordedBlob) {
      const url = URL.createObjectURL(recordedBlob);
      const audio = new Audio(url);
      audio.play().catch(err => {
        setError('Failed to play audio: ' + err.message);
      });
    }
  }

  // Seed pre-loaded content (Super Admin only)
  async function handleSeedContent() {
    if (!isSuperAdmin) {
      setError('Only Super Admins can seed content');
      return;
    }

    if (!window.confirm('This will add 25 pre-loaded Telugu words/phrases for age 2-4. Continue?')) {
      return;
    }

    try {
      setUploading(true);
      setError('');

      const seedData = getSeedContent();
      let successCount = 0;

      for (const item of seedData) {
        await addContent(item, currentUser.uid, true);
        successCount++;
      }

      setMessage(`Successfully seeded ${successCount} pre-loaded content items!`);
      await loadContent();
      setTimeout(() => setMessage(''), 5000);
    } catch (err) {
      setError('Failed to seed content: ' + err.message);
      console.error(err);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="content-management">
      <div className="content-header">
        <h2>
          {isSuperAdmin ? '🌟 Super Admin Content Management' : '📚 My Content Library'}
        </h2>
        <p className="content-subtitle">
          {isSuperAdmin
            ? 'Add pre-loaded content available to all users'
            : 'Add custom content for your children'}
        </p>
        {isSuperAdmin && (
          <button
            onClick={handleSeedContent}
            className="seed-btn"
            disabled={uploading}
          >
            🌱 Seed Pre-loaded Content (Age 2-4)
          </button>
        )}
      </div>

      {error && <div className="error-message">{error}</div>}
      {message && <div className="success-message">{message}</div>}

      {/* Add Content Form */}
      <form onSubmit={handleSubmit} className="content-form">
        <h3>Add New Content</h3>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="teluguText">Telugu Text *</label>
            <input
              type="text"
              id="teluguText"
              value={teluguText}
              onChange={(e) => setTeluguText(e.target.value)}
              placeholder="అమ్మ"
              required
              maxLength={100}
            />
          </div>

          <div className="form-group">
            <label htmlFor="englishTranslation">English Translation *</label>
            <input
              type="text"
              id="englishTranslation"
              value={englishTranslation}
              onChange={(e) => setEnglishTranslation(e.target.value)}
              placeholder="Mother"
              required
              maxLength={100}
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="ageGroup">Age Group *</label>
            <select
              id="ageGroup"
              value={ageGroup}
              onChange={(e) => setAgeGroup(e.target.value)}
              required
            >
              {AGE_GROUPS.map(group => (
                <option key={group} value={group}>{group} years</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="category">Category *</label>
            <select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              required
            >
              {CATEGORIES.map(cat => (
                <option key={cat} value={cat}>
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Audio Upload/Recording */}
        <div className="form-group audio-section">
          <label>Audio (Optional)</label>

          <div className="audio-options">
            {/* File Upload */}
            <div className="audio-option">
              <label htmlFor="audioFile" className="file-upload-btn">
                📎 Upload Audio File
              </label>
              <input
                type="file"
                id="audioFile"
                accept="audio/*"
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
              {audioFile && <span className="file-name">✓ {audioFile.name}</span>}
            </div>

            {/* Recording */}
            <div className="audio-option">
              {!isRecording ? (
                <button
                  type="button"
                  onClick={startRecording}
                  className="record-btn"
                  disabled={uploading}
                >
                  🎤 Record Audio
                </button>
              ) : (
                <button
                  type="button"
                  onClick={stopRecording}
                  className="record-btn recording"
                >
                  ⏹️ Stop Recording
                </button>
              )}
              {recordedBlob && (
                <span className="file-name">
                  ✓ Recorded
                  <button
                    type="button"
                    onClick={playRecordedPreview}
                    className="play-preview-btn"
                  >
                    ▶️
                  </button>
                </span>
              )}
            </div>
          </div>
        </div>

        <button type="submit" className="submit-btn" disabled={uploading}>
          {uploading ? 'Adding...' : isSuperAdmin ? '🌟 Add Pre-loaded Content' : '➕ Add Content'}
        </button>
      </form>

      {/* Content List */}
      <div className="content-list-section">
        <div className="content-list-header">
          <h3>Content Library</h3>

          {/* Filter */}
          <div className="filter-group">
            <label htmlFor="filterAge">Filter by Age:</label>
            <select
              id="filterAge"
              value={filterAgeGroup}
              onChange={(e) => setFilterAgeGroup(e.target.value)}
            >
              <option value="">All Ages</option>
              {AGE_GROUPS.map(group => (
                <option key={group} value={group}>{group} years</option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <p className="loading">Loading content...</p>
        ) : contentList.length === 0 ? (
          <p className="empty-state">
            No content yet. Add your first {isSuperAdmin ? 'pre-loaded ' : ''}item above!
          </p>
        ) : (
          <div className="content-grid">
            {contentList.map(content => (
              <div key={content.id} className="content-card">
                {content.isPreloaded && (
                  <span className="preloaded-badge">Pre-loaded</span>
                )}

                <div className="content-text">
                  <div className="telugu-text">{content.teluguText}</div>
                  <div className="english-text">{content.englishTranslation}</div>
                </div>

                <div className="content-meta">
                  <span className="age-badge">{content.ageGroup} years</span>
                  <span className="category-badge">{content.category}</span>
                </div>

                <div className="content-actions">
                  {content.audioUrl && (
                    <button
                      onClick={() => playAudio(content.audioUrl)}
                      className="play-btn"
                      title="Play audio"
                    >
                      ▶️ Play
                    </button>
                  )}

                  {/* Only allow deletion of own content or if super admin */}
                  {(content.createdBy === currentUser.uid || isSuperAdmin) && (
                    <button
                      onClick={() => handleDelete(content.id, content.audioUrl)}
                      className="delete-btn"
                      title="Delete"
                    >
                      🗑️
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
