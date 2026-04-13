'use client';

import { useState } from 'react';
import { 
  Mail, 
  Phone, 
  MapPin, 
  Clock,
  Send,
  Loader2,
  CheckCircle,
  Building2,
  Shield
} from 'lucide-react';

export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    department: '',
    subject: '',
    message: '',
    priority: 'normal'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
      setFormData({
        name: '',
        email: '',
        department: '',
        subject: '',
        message: '',
        priority: 'normal'
      });
    }, 1500);
  };

  const contactInfo = [
    {
      icon: Phone,
      title: 'Emergency Support',
      details: ['(800) 555-EMRG (3674)', '24/7 Critical Support'],
      color: 'bg-red-100 text-red-600'
    },
    {
      icon: Mail,
      title: 'General Inquiries',
      details: ['support@govdashboard.gov', 'Response within 24 hours'],
      color: 'bg-blue-100 text-blue-600'
    },
    {
      icon: MapPin,
      title: 'Headquarters',
      details: ['Government Complex', 'Capital City, State 10001'],
      color: 'bg-green-100 text-green-600'
    },
    {
      icon: Clock,
      title: 'Office Hours',
      details: ['Mon-Fri: 8:00 AM - 6:00 PM EST', 'Closed on Federal Holidays'],
      color: 'bg-purple-100 text-purple-600'
    }
  ];

  const departments = [
    'General Inquiry',
    'Technical Support',
    'Security Incident',
    'Account Management',
    'System Access',
    'Compliance & Legal'
  ];

  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary-700 to-primary-800 text-white py-16 md:py-24">
        <div className="container-responsive">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Contact Government Support
            </h1>
            <p className="text-xl opacity-90">
              Secure communication channels for government agencies and authorized personnel
            </p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-16 bg-gray-50 flex-grow">
        <div className="container-responsive">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Contact Form */}
            <div className="lg:col-span-2">
              <div className="card p-6 md:p-8">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
                    <Send className="h-6 w-6 text-primary-600" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      Submit Inquiry
                    </h2>
                    <p className="text-gray-600">
                      All submissions are encrypted and secure
                    </p>
                  </div>
                </div>

                {isSubmitted ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                      <CheckCircle className="h-8 w-8 text-green-600" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-4">
                      Message Sent Successfully
                    </h3>
                    <p className="text-gray-600 mb-6">
                      Your inquiry has been submitted securely. A government representative 
                      will contact you within 24 hours.
                    </p>
                    <button
                      onClick={() => setIsSubmitted(false)}
                      className="btn-primary"
                    >
                      Send Another Message
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Full Name *
                        </label>
                        <input
                          type="text"
                          name="name"
                          required
                          value={formData.name}
                          onChange={handleChange}
                          className="input-field"
                          placeholder="John Smith"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Government Email *
                        </label>
                        <input
                          type="email"
                          name="email"
                          required
                          value={formData.email}
                          onChange={handleChange}
                          className="input-field"
                          placeholder="name@agency.gov"
                        />
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Department/Agency *
                        </label>
                        <select
                          name="department"
                          required
                          value={formData.department}
                          onChange={handleChange}
                          className="input-field"
                        >
                          <option value="">Select Department</option>
                          {departments.map(dept => (
                            <option key={dept} value={dept}>{dept}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Priority Level
                        </label>
                        <select
                          name="priority"
                          value={formData.priority}
                          onChange={handleChange}
                          className="input-field"
                        >
                          <option value="low">Low Priority</option>
                          <option value="normal">Normal Priority</option>
                          <option value="high">High Priority</option>
                          <option value="urgent">Urgent (Emergency)</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Subject *
                      </label>
                      <input
                        type="text"
                        name="subject"
                        required
                        value={formData.subject}
                        onChange={handleChange}
                        className="input-field"
                        placeholder="Brief description of your inquiry"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Message *
                      </label>
                      <textarea
                        name="message"
                        required
                        rows="6"
                        value={formData.message}
                        onChange={handleChange}
                        className="input-field"
                        placeholder="Please provide detailed information about your inquiry..."
                      />
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                      <div className="flex items-start space-x-3">
                        <Shield className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-sm text-blue-800 font-medium mb-1">
                            Secure Transmission
                          </p>
                          <p className="text-xs text-blue-700">
                            All messages are encrypted end-to-end. Your communication is protected 
                            by military-grade encryption protocols.
                          </p>
                        </div>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full btn-primary flex items-center justify-center space-x-2"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="animate-spin h-5 w-5" />
                          <span>Submitting Securely...</span>
                        </>
                      ) : (
                        <>
                          <Send className="h-5 w-5" />
                          <span>Submit Secure Message</span>
                        </>
                      )}
                    </button>
                  </form>
                )}
              </div>
            </div>

            {/* Contact Information */}
            <div className="space-y-6">
              {contactInfo.map((info, index) => {
                const Icon = info.icon;
                return (
                  <div key={index} className="card p-6">
                    <div className="flex items-start space-x-4">
                      <div className={`${info.color} w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0`}>
                        <Icon className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-2">
                          {info.title}
                        </h3>
                        {info.details.map((detail, idx) => (
                          <p key={idx} className="text-gray-600 text-sm">
                            {detail}
                          </p>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Emergency Notice */}
              <div className="card p-6 border-red-200 bg-red-50">
                <h3 className="font-semibold text-red-800 mb-3 flex items-center">
                  <Shield className="h-5 w-5 mr-2" />
                  Security Emergency
                </h3>
                <p className="text-red-700 text-sm mb-3">
                  For suspected security breaches or unauthorized access:
                </p>
                <div className="space-y-2">
                  <a 
                    href="tel:8005553674" 
                    className="block text-center bg-red-600 text-white px-4 py-3 rounded-lg font-semibold hover:bg-red-700 transition-colors"
                  >
                    EMERGENCY HOTLINE
                  </a>
                  <p className="text-xs text-red-600 text-center">
                    Available 24/7 for critical incidents
                  </p>
                </div>
              </div>

              {/* Response Time */}
              <div className="card p-6 bg-primary-50 border-primary-100">
                <h3 className="font-semibold text-primary-800 mb-2">
                  Response Times
                </h3>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex justify-between">
                    <span>Emergency:</span>
                    <span className="font-semibold">&lt; 15 minutes</span>
                  </li>
                  <li className="flex justify-between">
                    <span>High Priority:</span>
                    <span className="font-semibold">1-2 hours</span>
                  </li>
                  <li className="flex justify-between">
                    <span>Normal:</span>
                    <span className="font-semibold">24 hours</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}