"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import { FiCheck, FiLoader, FiAlertCircle } from "react-icons/fi";

export default function ContactPage() {
  const { user } = useUser();
  const router = useRouter();
  const [formData, setFormData] = useState({
    category: "",
    subject: "",
    description: "",
    email: user?.emailAddresses?.[0]?.emailAddress || "",
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const categories = [
    "Dashboard",
    "Learn",
    "Roadmaps",
    "Quests",
    "Dev Discuss",
    "Playground",
    "Other"
  ];

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.category) {
      newErrors.category = "Please select a category";
    }
    
    if (!formData.subject.trim()) {
      newErrors.subject = "Subject is required";
    } else if (formData.subject.length < 5) {
      newErrors.subject = "Subject must be at least 5 characters";
    }
    
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email";
    }
    
    if (!formData.description.trim()) {
      newErrors.description = "Message is required";
    } else if (formData.description.length < 20) {
      newErrors.description = "Message must be at least 20 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    // Simulate API call with timeout
    await new Promise(resolve => setTimeout(resolve, 1500));

    setShowSuccess(true);

    // Redirect after showing success state
    setTimeout(() => {
      router.push('/faq');
    }, 2000);
  };

  if (showSuccess) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="text-center">
          <div className="mb-6 flex justify-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <FiCheck className="w-8 h-8 text-green-600" />
            </div>
          </div>
          <h2 className="text-2xl font-bold mb-2">Message Sent Successfully!</h2>
          <p className="text-gray-600 mb-6">
            Thank you for reaching out. We'll get back to you within 24-48 hours.
          </p>
          <p className="text-gray-500 text-sm">
            Redirecting you back to FAQ...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Contact Us</h1>
        <p className="text-gray-600">
          Have a question? We'd love to hear from you.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-2">
            Category <span className="text-red-500">*</span>
          </label>
          <Select
            value={formData.category}
            onValueChange={(value) => {
              setFormData({ ...formData, category: value });
              setErrors({ ...errors, category: "" });
            }}
            disabled={isSubmitting}
          >
            <SelectTrigger className={errors.category ? "border-red-500" : ""}>
              <SelectValue placeholder="Select a category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category} value={category.toLowerCase()}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.category && (
            <p className="mt-1 text-sm text-red-500 flex items-center">
              <FiAlertCircle className="w-4 h-4 mr-1" />
              {errors.category}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Subject <span className="text-red-500">*</span>
          </label>
          <Input
            type="text"
            value={formData.subject}
            onChange={(e) => {
              setFormData({ ...formData, subject: e.target.value });
              setErrors({ ...errors, subject: "" });
            }}
            placeholder="Brief description of your question"
            className={errors.subject ? "border-red-500" : ""}
            disabled={isSubmitting}
          />
          {errors.subject && (
            <p className="mt-1 text-sm text-red-500 flex items-center">
              <FiAlertCircle className="w-4 h-4 mr-1" />
              {errors.subject}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Email <span className="text-red-500">*</span>
          </label>
          <Input
            type="email"
            value={formData.email}
            onChange={(e) => {
              setFormData({ ...formData, email: e.target.value });
              setErrors({ ...errors, email: "" });
            }}
            placeholder="Your email address"
            className={errors.email ? "border-red-500" : ""}
            disabled={isSubmitting}
          />
          {errors.email && (
            <p className="mt-1 text-sm text-red-500 flex items-center">
              <FiAlertCircle className="w-4 h-4 mr-1" />
              {errors.email}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Message <span className="text-red-500">*</span>
          </label>
          <Textarea
            value={formData.description}
            onChange={(e) => {
              setFormData({ ...formData, description: e.target.value });
              setErrors({ ...errors, description: "" });
            }}
            placeholder="Type your message here..."
            rows={6}
            className={errors.description ? "border-red-500" : ""}
            disabled={isSubmitting}
          />
          {errors.description && (
            <p className="mt-1 text-sm text-red-500 flex items-center">
              <FiAlertCircle className="w-4 h-4 mr-1" />
              {errors.description}
            </p>
          )}
        </div>

        <Button
          type="submit"
          className="w-full relative"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center">
              <FiLoader className="w-5 h-5 mr-2 animate-spin" />
              Sending...
            </span>
          ) : (
            "Send Message"
          )}
        </Button>
      </form>

      <div className="mt-8 text-center text-sm text-gray-600">
        <p>We typically respond within 24-48 hours</p>
        <p className="mt-1">For urgent inquiries, please include "URGENT" in the subject line</p>
      </div>
    </div>
  );
}
