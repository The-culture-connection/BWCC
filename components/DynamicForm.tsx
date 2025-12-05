'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

interface DynamicFormProps {
  type: string;
  onSuccess: () => void;
}

const formDefinitions: Record<string, any> = {
  speak: {
    sections: [
      {
        title: 'Contact Information',
        fields: [
          { name: 'name', label: 'Name', type: 'text', required: true, mapsTo: 'Name' },
          { name: 'organization', label: 'Organization', type: 'text', required: true, mapsTo: 'Organization' },
          { name: 'email', label: 'Email', type: 'email', required: true, mapsTo: 'Email' },
          { name: 'phone', label: 'Phone Number', type: 'tel', required: false, mapsTo: 'Phone' },
        ],
      },
      {
        title: 'Speaking Request Details',
        fields: [
          { name: 'engagementType', label: 'What type of speaking engagement do you need?', type: 'select', options: ['Keynote', 'Workshop', 'Panel participation', 'Training session', 'Other'], required: true, mapsTo: 'Details' },
          { name: 'audience', label: 'What is the audience?', type: 'text', required: true, mapsTo: 'Details' },
          { name: 'topics', label: 'What topic(s) are you interested in?', type: 'checkbox', options: ['Cultural capital', 'Community building', 'Black wealth ecosystems', 'Mental health & community care', 'Organizational culture', 'Other'], required: true, mapsTo: 'Details' },
          { name: 'otherTopic', label: 'Other topic (if selected)', type: 'text', required: false, mapsTo: 'Details' },
          { name: 'purpose', label: 'What is the purpose of this event?', type: 'textarea', required: true, mapsTo: 'Details' },
          { name: 'attendees', label: 'Expected number of attendees', type: 'number', required: true, mapsTo: 'Details' },
          { name: 'location', label: 'Event location (address or virtual link)', type: 'text', required: true, mapsTo: 'Details' },
          { name: 'additionalNotes', label: 'Additional notes or requests', type: 'textarea', required: false, mapsTo: 'Details' },
        ],
      },
      {
        title: 'Budget & Scheduling',
        fields: [
          { name: 'budget', label: 'Budget / Compensation available', type: 'text', required: false, mapsTo: 'Budget / Compensation' },
          { name: 'preferredDate', label: 'Preferred date', type: 'date', required: true, mapsTo: 'Preferred Dates' },
          { name: 'preferredStartTime', label: 'Preferred start time', type: 'time', required: true, mapsTo: 'Preferred Dates' },
          { name: 'preferredEndTime', label: 'Preferred end time', type: 'time', required: false, mapsTo: 'Preferred Dates' },
        ],
      },
      {
        title: 'Additional Information',
        fields: [
          { name: 'moreInfoLink', label: 'Link to More Information PDF (optional)', type: 'url', required: false, mapsTo: 'Uploaded Files' },
        ],
      },
    ],
  },
  partner: {
    sections: [
      {
        title: 'Contact Information',
        fields: [
          { name: 'name', label: 'Point of Contact Name', type: 'text', required: true, mapsTo: 'Name' },
          { name: 'organization', label: 'Organization name', type: 'text', required: true, mapsTo: 'Organization' },
          { name: 'email', label: 'Email', type: 'email', required: true, mapsTo: 'Email' },
          { name: 'phone', label: 'Phone number', type: 'tel', required: false, mapsTo: 'Phone' },
        ],
      },
      {
        title: 'Partnership Request Details',
        fields: [
          { name: 'partnershipType', label: 'What type of partnership are you seeking?', type: 'select', options: ['Program collaboration', 'Speaking / workshop', 'Research or data project', 'Community event', 'Consulting / expertise', 'Other'], required: true, mapsTo: 'Details' },
          { name: 'problem', label: 'What need/problem are you trying to solve?', type: 'textarea', required: true, mapsTo: 'Details' },
          { name: 'outcomes', label: 'What outcomes do you want from this partnership?', type: 'textarea', required: true, mapsTo: 'Details' },
          { name: 'additionalNotes', label: 'Additional information', type: 'textarea', required: false, mapsTo: 'Details' },
        ],
      },
      {
        title: 'Budget & Timeline',
        fields: [
          { name: 'budget', label: 'Budget / Resources available', type: 'text', required: false, mapsTo: 'Budget / Compensation' },
          { name: 'timeline', label: 'Preferred timeline/dates', type: 'text', required: true, mapsTo: 'Preferred Dates' },
        ],
      },
      {
        title: 'Additional Information',
        fields: [
          { name: 'moreInfoLink', label: 'Link to More Information PDF (optional)', type: 'url', required: false, mapsTo: 'Uploaded Files' },
        ],
      },
    ],
  },
  listening: {
    sections: [
      {
        title: 'Contact Information',
        fields: [
          { name: 'name', label: 'Name', type: 'text', required: true, mapsTo: 'Name' },
          { name: 'organization', label: 'Organization', type: 'text', required: true, mapsTo: 'Organization' },
          { name: 'email', label: 'Email', type: 'email', required: true, mapsTo: 'Email' },
          { name: 'phone', label: 'Phone number', type: 'tel', required: false, mapsTo: 'Phone' },
        ],
      },
      {
        title: 'Listening Session Details',
        fields: [
          { name: 'goal', label: 'What is your goal for this listening session?', type: 'textarea', required: true, mapsTo: 'Details' },
          { name: 'metric', label: 'What metric or outcome do you want measured?', type: 'text', required: true, mapsTo: 'Details' },
          { name: 'analysis', label: 'What analysis do you want us to produce afterward?', type: 'textarea', required: true, mapsTo: 'Details' },
          { name: 'demographic', label: 'Who is the target demographic for participants?', type: 'text', required: true, mapsTo: 'Details' },
          { name: 'participants', label: 'How many participants do you need?', type: 'number', required: true, mapsTo: 'Details' },
          { name: 'locationSupport', label: 'Are you providing a location or do you need us to find one?', type: 'radio', options: ['I have a location', 'I need location support'], required: true, mapsTo: 'Details' },
          { name: 'location', label: 'Location (if you have one)', type: 'text', required: false, mapsTo: 'Details' },
        ],
      },
      {
        title: 'Budget & Scheduling',
        fields: [
          { name: 'compensation', label: 'Compensation provided (per participant)', type: 'text', required: false, mapsTo: 'Budget / Compensation' },
          { name: 'preferredDate', label: 'Preferred date', type: 'date', required: true, mapsTo: 'Preferred Dates' },
          { name: 'preferredStartTime', label: 'Preferred start time', type: 'time', required: true, mapsTo: 'Preferred Dates' },
          { name: 'preferredEndTime', label: 'Preferred end time', type: 'time', required: false, mapsTo: 'Preferred Dates' },
        ],
      },
      {
        title: 'Documents',
        fields: [
          { name: 'documents', label: 'Upload any documents or background information (optional)', type: 'file', required: false, mapsTo: 'Uploaded Files' },
        ],
      },
    ],
  },
  'panel-topic': {
    sections: [
      {
        title: 'Contact Information',
        fields: [
          { name: 'name', label: 'Your name', type: 'text', required: true, mapsTo: 'Name' },
          { name: 'email', label: 'Email', type: 'email', required: true, mapsTo: 'Email' },
          { name: 'phone', label: 'Phone (optional)', type: 'tel', required: false, mapsTo: 'Phone' },
        ],
      },
      {
        title: 'Panel Topic Details',
        fields: [
          { name: 'topic', label: 'What topic do you want us to host a panel about?', type: 'text', required: true, mapsTo: 'Details' },
          { name: 'importance', label: 'Why is this topic important right now?', type: 'textarea', required: true, mapsTo: 'Details' },
          { name: 'suggestedPanelists', label: 'Who do you suggest as potential panelists?', type: 'textarea', required: false, mapsTo: 'Details' },
          { name: 'keyQuestions', label: 'What are 1–3 key questions we should ask the panel?', type: 'textarea', required: true, mapsTo: 'Details' },
          { name: 'interested', label: 'Are you interested in attending if we host this panel?', type: 'radio', options: ['Yes', 'No'], required: true, mapsTo: 'Details' },
        ],
      },
    ],
  },
  panelist: {
    sections: [
      {
        title: 'Contact Information',
        fields: [
          { name: 'name', label: 'Name', type: 'text', required: true, mapsTo: 'Name' },
          { name: 'email', label: 'Email', type: 'email', required: true, mapsTo: 'Email' },
          { name: 'phone', label: 'Phone', type: 'tel', required: false, mapsTo: 'Phone' },
          { name: 'organization', label: 'Organization (optional)', type: 'text', required: false, mapsTo: 'Organization' },
        ],
      },
      {
        title: 'Panelist Application Details',
        fields: [
          { name: 'bio', label: 'Short bio (3–5 sentences)', type: 'textarea', required: true, mapsTo: 'Details' },
          { name: 'expertise', label: 'Areas of expertise', type: 'textarea', required: true, mapsTo: 'Details' },
          { name: 'topics', label: 'Topics you want to speak on', type: 'textarea', required: true, mapsTo: 'Details' },
          { name: 'experience', label: 'Previous speaking experience', type: 'textarea', required: false, mapsTo: 'Details' },
          { name: 'availability', label: 'Availability (evenings/weekends/etc.)', type: 'text', required: true, mapsTo: 'Details' },
        ],
      },
      {
        title: 'Additional Information',
        fields: [
          { name: 'moreInfoLink', label: 'Link to More Information PDF (optional)', type: 'url', required: false, mapsTo: 'Uploaded Files' },
        ],
      },
    ],
  },
  volunteer: {
    sections: [
      {
        title: 'Contact Information',
        fields: [
          { name: 'name', label: 'Name', type: 'text', required: true, mapsTo: 'Name' },
          { name: 'email', label: 'Email', type: 'email', required: true, mapsTo: 'Email' },
          { name: 'phone', label: 'Phone', type: 'tel', required: false, mapsTo: 'Phone' },
          { name: 'organization', label: 'Organization (optional)', type: 'text', required: false, mapsTo: 'Organization' },
        ],
      },
      {
        title: 'Volunteer Application Details',
        fields: [
          { name: 'supportTypes', label: 'What types of support are you available for?', type: 'checkbox', options: ['Event setup', 'Photography / videography', 'Food & catering support', 'Outreach', 'Research / analysis', 'Social media support', 'Operations'], required: true, mapsTo: 'Details' },
          { name: 'availability', label: 'Availability (weekdays, weekends, evenings)', type: 'text', required: true, mapsTo: 'Details' },
          { name: 'skills', label: 'Skills or past experience', type: 'textarea', required: false, mapsTo: 'Details' },
          { name: 'workWithYouth', label: 'Are you comfortable working with children/teens?', type: 'radio', options: ['Yes', 'No', 'Not applicable'], required: false, mapsTo: 'Details' },
          { name: 'transportation', label: 'Transportation access', type: 'radio', options: ['Yes', 'No'], required: true, mapsTo: 'Details' },
        ],
      },
    ],
  },
  training: {
    sections: [
      {
        title: 'Contact Information',
        fields: [
          { name: 'name', label: 'Name', type: 'text', required: true, mapsTo: 'Name' },
          { name: 'email', label: 'Email', type: 'email', required: true, mapsTo: 'Email' },
          { name: 'phone', label: 'Phone', type: 'tel', required: false, mapsTo: 'Phone' },
          { name: 'organization', label: 'Organization (optional)', type: 'text', required: false, mapsTo: 'Organization' },
        ],
      },
      {
        title: 'Training Request Details',
        fields: [
          { name: 'trainingType', label: 'Which training are you interested in?', type: 'select', options: ['Mental health', 'Cultural capital', 'DEI / workplace culture', 'Community engagement', 'Youth support', 'Other'], required: true, mapsTo: 'Details' },
          { name: 'hopes', label: 'What do you hope to learn?', type: 'textarea', required: true, mapsTo: 'Details' },
          { name: 'certification', label: 'Are you seeking certification?', type: 'radio', options: ['Yes', 'No'], required: true, mapsTo: 'Details' },
        ],
      },
      {
        title: 'Budget & Scheduling',
        fields: [
          { name: 'preferredDate', label: 'Preferred date', type: 'date', required: true, mapsTo: 'Preferred Dates' },
          { name: 'preferredStartTime', label: 'Preferred start time', type: 'time', required: false, mapsTo: 'Preferred Dates' },
        ],
      },
    ],
  },
  podcast: {
    sections: [
      {
        title: 'Contact Information',
        fields: [
          { name: 'name', label: 'Name', type: 'text', required: true, mapsTo: 'Name' },
          { name: 'email', label: 'Email', type: 'email', required: true, mapsTo: 'Email' },
          { name: 'phone', label: 'Phone', type: 'tel', required: false, mapsTo: 'Phone' },
          { name: 'organization', label: 'Organization (optional)', type: 'text', required: false, mapsTo: 'Organization' },
        ],
      },
      {
        title: 'Podcast Guest Application Details',
        fields: [
          { name: 'why', label: 'Why do you want to be on the podcast?', type: 'textarea', required: true, mapsTo: 'Details' },
          { name: 'topic', label: 'What topic/story do you want to share?', type: 'textarea', required: true, mapsTo: 'Details' },
          { name: 'pastInterviews', label: 'Links to any past interviews (optional)', type: 'textarea', required: false, mapsTo: 'Details' },
        ],
      },
      {
        title: 'Additional Information',
        fields: [
          { name: 'moreInfoLink', label: 'Link to More Information PDF (optional)', type: 'url', required: false, mapsTo: 'Uploaded Files' },
        ],
      },
    ],
  },
  share: {
    sections: [
      {
        title: 'Contact Information',
        fields: [
          { name: 'name', label: 'Name', type: 'text', required: true, mapsTo: 'Name' },
          { name: 'email', label: 'Email', type: 'email', required: true, mapsTo: 'Email' },
          { name: 'phone', label: 'Phone (optional)', type: 'tel', required: false, mapsTo: 'Phone' },
        ],
      },
      {
        title: 'Opportunity / Resource Details',
        fields: [
          { name: 'type', label: 'Type of opportunity/resource', type: 'select', options: ['Job', 'Grant', 'Scholarship', 'Event', 'Program', 'Other'], required: true, mapsTo: 'Details' },
          { name: 'audience', label: 'Who is it for?', type: 'text', required: true, mapsTo: 'Details' },
          { name: 'why', label: 'Why should our community know about it?', type: 'textarea', required: true, mapsTo: 'Details' },
          { name: 'link', label: 'Link to apply', type: 'url', required: false, mapsTo: 'Details' },
        ],
      },
      {
        title: 'Timeline',
        fields: [
          { name: 'deadline', label: 'Deadline (if applicable)', type: 'date', required: false, mapsTo: 'Preferred Dates' },
        ],
      },
      {
        title: 'Additional Information',
        fields: [
          { name: 'moreInfoLink', label: 'Link to More Information PDF (optional)', type: 'url', required: false, mapsTo: 'Uploaded Files' },
        ],
      },
    ],
  },
};

export default function DynamicForm({ type, onSuccess }: DynamicFormProps) {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  const formDef = formDefinitions[type];

  if (!formDef) {
    return <div>Form type not found</div>;
  }

  const handleChange = (name: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage('');

    try {
      const response = await fetch('/api/get-involved', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type,
          ...formData,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('Thank you! Your submission has been received.');
        setTimeout(() => {
          onSuccess();
        }, 2000);
      } else {
        setMessage(data.error || 'Something went wrong. Please try again.');
      }
    } catch (error: any) {
      setMessage(`An error occurred: ${error.message || 'Please try again.'}`);
      console.error('Form submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderField = (field: any) => {
    const value = formData[field.name] || '';

    switch (field.type) {
      case 'textarea':
        return (
          <textarea
            value={value}
            onChange={(e) => handleChange(field.name, e.target.value)}
            required={field.required}
            rows={4}
            className="w-full px-4 py-3 border border-brand-tan rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-gold focus:border-transparent resize-none font-secondary"
            placeholder={field.label}
          />
        );

      case 'select':
        return (
          <select
            value={value}
            onChange={(e) => handleChange(field.name, e.target.value)}
            required={field.required}
            className="w-full px-4 py-3 border border-brand-tan rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-gold focus:border-transparent font-secondary"
          >
            <option value="">Select an option</option>
            {field.options?.map((opt: string) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        );

      case 'radio':
        return (
          <div className="space-y-2">
            {field.options?.map((opt: string) => (
              <label key={opt} className="flex items-center space-x-2 font-secondary">
                <input
                  type="radio"
                  name={field.name}
                  value={opt}
                  checked={value === opt}
                  onChange={(e) => handleChange(field.name, e.target.value)}
                  required={field.required}
                  className="text-brand-gold focus:ring-brand-gold"
                />
                <span>{opt}</span>
              </label>
            ))}
          </div>
        );

      case 'checkbox':
        return (
          <div className="space-y-2">
            {field.options?.map((opt: string) => {
              const checked = Array.isArray(value) ? value.includes(opt) : false;
              return (
                <label key={opt} className="flex items-center space-x-2 font-secondary">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => {
                      const current = Array.isArray(value) ? value : [];
                      if (e.target.checked) {
                        handleChange(field.name, [...current, opt]);
                      } else {
                        handleChange(field.name, current.filter((v: string) => v !== opt));
                      }
                    }}
                    className="text-brand-gold focus:ring-brand-gold"
                  />
                  <span>{opt}</span>
                </label>
              );
            })}
          </div>
        );


      case 'time':
        return (
          <input
            type="time"
            value={value}
            onChange={(e) => handleChange(field.name, e.target.value)}
            required={field.required}
            className="w-full px-4 py-3 border border-brand-tan rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-gold focus:border-transparent font-secondary"
          />
        );

      default:
        return (
          <input
            type={field.type || 'text'}
            value={value}
            onChange={(e) => handleChange(field.name, e.target.value)}
            required={field.required}
            className="w-full px-4 py-3 border border-brand-tan rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-gold focus:border-transparent font-secondary"
            placeholder={field.label}
          />
        );
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {formDef.sections.map((section: any, sectionIndex: number) => (
        <div key={sectionIndex} className="space-y-6">
          <h3 className="text-2xl font-primary font-bold text-brand-black border-b border-brand-gold/30 pb-2">
            {section.title}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {section.fields.map((field: any, fieldIndex: number) => {
              // Handle conditional fields
              if (field.name === 'otherTopic' && !formData.topics?.includes('Other')) {
                return null;
              }
              // Show location field only if "I have a location" is selected
              if (field.name === 'location' && formData.locationSupport !== 'I have a location') {
                return null;
              }
              
              // Full width for textarea, select, checkbox, radio
              const isFullWidth = ['textarea', 'select', 'checkbox', 'radio'].includes(field.type);
              
              return (
                <div
                  key={fieldIndex}
                  className={isFullWidth ? 'md:col-span-2' : ''}
                >
                  <label className="block text-brand-black font-secondary font-semibold mb-2">
                    {field.label}
                    {field.required && <span className="text-brand-brown ml-1">*</span>}
                  </label>
                  {renderField(field)}
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {message && (
        <div className={`p-4 rounded-lg font-secondary ${
          message.includes('Thank you')
            ? 'bg-green-100 text-green-800 border border-green-300'
            : 'bg-red-100 text-red-800 border border-red-300'
        }`}>
          {message}
        </div>
      )}

      <div className="flex justify-end space-x-4 pt-6">
        <button
          type="button"
          onClick={onSuccess}
          className="px-6 py-3 border border-brand-tan rounded-lg hover:bg-brand-cream transition-colors font-secondary font-semibold"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="bg-brand-gold text-brand-black px-8 py-3 rounded-lg hover:bg-brand-brown hover:text-white transition-colors font-semibold flex items-center gap-2 font-secondary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Submitting...' : 'Submit'}
          {!isSubmitting && <ArrowRight size={20} />}
        </button>
      </div>
    </form>
  );
}
