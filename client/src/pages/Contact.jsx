import { useState } from 'react';
import toast from 'react-hot-toast';
import { Helmet } from 'react-helmet-async';

export default function Contact() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  function handleSubmit(e) {
    e.preventDefault();
    if (!name || !email || !message) {
      toast.error('Please fill in all required fields');
      return;
    }
    setSending(true);
    setTimeout(() => {
      setSending(false);
      toast.success('Message sent! We will get back to you soon.');
      setName('');
      setEmail('');
      setSubject('');
      setMessage('');
    }, 1000);
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <Helmet>
        <title>Contact Us - BlingzStore</title>
        <meta name="description" content="Get in touch with BlingzStore. We are here to help with your orders and inquiries." />
      </Helmet>
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Contact Us</h1>
      <p className="text-gray-600 mb-8">Have a question or need help? We would love to hear from you.</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
          <h3 className="font-semibold text-gray-900 mb-1">Email</h3>
          <p className="text-sm text-gray-600">support@blingzstore.com</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
          <h3 className="font-semibold text-gray-900 mb-1">Phone</h3>
          <p className="text-sm text-gray-600">+234 800 000 000</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
          <h3 className="font-semibold text-gray-900 mb-1">Address</h3>
          <p className="text-sm text-gray-600">Abuja, Utako</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Send a Message</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Message *</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
              rows={5}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 resize-none"
            />
          </div>
          <button
            type="submit"
            disabled={sending}
            className="bg-gray-900 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-gray-700 disabled:opacity-50 cursor-pointer border-none"
          >
            {sending ? 'Sending...' : 'Send Message'}
          </button>
        </form>
      </div>
    </div>
  );
}
