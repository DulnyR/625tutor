"use client";

import React, { useState } from 'react';
import emailjs from 'emailjs-com'; // Import EmailJS

const ContactClient = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        message: '',
    });

    const [formStatus, setFormStatus] = useState('');

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Add loading state
        setFormStatus('Sending message...');
    
        try {
            // Validate form data
            if (!formData.name.trim() || !formData.email.trim() || !formData.message.trim()) {
                throw new Error('Please fill in all fields');
            }
    
            // Initialize EmailJS if not already done
            emailjs.init('t6AIpPEx5uTKbEs1m');
    
            // Use EmailJS to send the email
            const result = await emailjs.send(
                '625tutor', // service ID
                'template_isbh23j', // template ID
                {
                    from_name: formData.name,
                    from_email: formData.email,
                    message: formData.message,
                },
                't6AIpPEx5uTKbEs1m' // public key
            );
    
            // Send confirmation email (don't await this one to avoid blocking)
            emailjs.send("625tutor", "template_qxm0z4i", {
                name: formData.name,
                email: formData.email,
            }, 't6AIpPEx5uTKbEs1m').catch(err => {
                console.warn('Confirmation email failed:', err);
            });
    
            console.log('Email sent successfully:', result.text);
            setFormStatus('Thank you for reaching out! We will get back to you soon.');
            setFormData({ name: '', email: '', message: '' });
    
        } catch (error) {
            console.error('Error sending email:', error);
            
            // More specific error messages
            let errorMessage = 'Something went wrong. Please try again later.';
            
            if (error.text) {
                errorMessage = `Failed to send email: ${error.text}`;
            } else if (error.message) {
                errorMessage = error.message;
            }
            
            setFormStatus(<span style={{ color: 'red' }}>{errorMessage}</span>);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-orange-50 to-purple-50 py-16 px-6 mt-20">
            <div className="max-w-4xl mx-auto bg-white shadow-lg rounded-lg p-8">
                <h1 className="text-3xl font-bold text-gray-800 text-center mb-6">Contact Us</h1>
                <p className="text-gray-600 text-center mb-8">
                    Have questions or need assistance? Fill out the form below, and we'll get back to you as soon as possible.
                </p>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Name Field */}
                    <div>
                        <label htmlFor="name" className="block text-gray-700 font-medium mb-2">
                            Your Name
                        </label>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            required
                            className="w-full border border-gray-300 text-black rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                            placeholder="Enter your name"
                        />
                    </div>

                    {/* Email Field */}
                    <div>
                        <label htmlFor="email" className="block text-gray-700 font-medium mb-2">
                            Your Email
                        </label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                            className="w-full border border-gray-300 text-black rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                            placeholder="Enter your email"
                        />
                    </div>

                    {/* Message Field */}
                    <div>
                        <label htmlFor="message" className="block text-gray-700 font-medium mb-2">
                            Your Message
                        </label>
                        <textarea
                            id="message"
                            name="message"
                            value={formData.message}
                            onChange={handleChange}
                            required
                            rows="5"
                            className="w-full border border-gray-300 text-black rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                            placeholder="Enter your message"
                        ></textarea>
                    </div>

                    {/* Submit Button */}
                    <div className="text-center">
                        <button
                            type="submit"
                            className="bg-purple-600 text-white py-3 px-8 rounded-lg font-semibold text-lg hover:bg-purple-700 transition duration-300 ease-in-out shadow-md hover:shadow-lg transform hover:-translate-y-1"
                        >
                            Send Message
                        </button>
                    </div>
                </form>

                {/* Form Status */}
                {formStatus && (
                    <p className="text-center text-green-600 font-medium mt-6">{formStatus}</p>
                )}
            </div>
        </div>
    );
};

export default ContactClient;