"use client";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useState } from "react";
import { FaGithub, FaLinkedin, FaTwitter } from "react-icons/fa";

const LandingPage = () => {
  const [hoveredFeature, setHoveredFeature] = useState(null);
  const [selectedRole, setSelectedRole] = useState("Teacher");

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#323231] to-[#cf4500] text-white w-full overflow-hidden">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center px-4 py-20">
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            animate={{
              scale: [1, 1.1, 1],
              rotate: [0, 5, -5, 0],
            }}
            transition={{ duration: 20, repeat: Infinity }}
            className="w-full h-full bg-gradient-to-br from-[#323231] to-[#cf4500] opacity-10"
          />
        </div>
        <div className="z-10 text-center max-w-4xl mx-auto">
          <motion.h1
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6"
          >
            Revolutionize Your Coding Classroom
          </motion.h1>
          <motion.p
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="text-lg md:text-xl lg:text-2xl mb-12"
          >
            Empower teachers and students with real-time collaboration,
            monitoring, and feedback in a cutting-edge coding environment.
          </motion.p>
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-4"
          >
            <Link
              href="/sign-up"
              className="w-full sm:w-auto bg-[#cf4500] text-white py-3 px-8 rounded-full text-lg font-semibold hover:bg-[#ff5500] transition duration-300"
            >
              Get Started
            </Link>
            <Link
              href="/demo"
              className="w-full sm:w-auto bg-transparent border-2 border-white text-white py-3 px-8 rounded-full text-lg font-semibold hover:bg-white hover:text-[#323231] transition duration-300"
            >
              Schedule Demo
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Key Features Section */}
      <section className="py-20 px-4 bg-gradient-to-br from-[#1a1a1a] to-[#2c2c2c]">
        <div className="max-w-6xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-3xl md:text-4xl lg:text-5xl font-bold mb-16 text-center text-white"
          >
            Powerful Features for Effective Learning
          </motion.h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                className="bg-gradient-to-br from-[#cf4500] to-[#ff5500] p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300"
              >
                <div className="flex items-center mb-4">
                  <span className="text-4xl mr-4">{feature.icon}</span>
                  <h3 className="text-xl font-semibold text-white">
                    {feature.title}
                  </h3>
                </div>
                <p className="text-gray-100">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 px-4 bg-[#ffffff] text-[#000000]">
        <div className="max-w-6xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-3xl md:text-4xl lg:text-5xl font-bold mb-12 text-center"
          >
            Seamless Collaboration Process
          </motion.h2>
          <div className="space-y-20">
            {steps.map((step, index) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                className={`flex flex-col ${
                  index % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"
                } items-center`}
              >
                <div className="w-full md:w-1/2 mb-8 md:mb-0">
                  <h3 className="text-2xl font-semibold mb-4">{step.title}</h3>
                  <p className="text-gray-600">{step.description}</p>
                </div>
                <div className="w-full md:w-1/2 flex justify-center">
                  <motion.img
                    src={step.svgSrc}
                    alt={step.title}
                    width={150}
                    height={150}
                    initial={{ opacity: 0, scale: 0.5 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                    className="w-32 h-32 md:w-40 md:h-40"
                  />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section className="py-20 px-4 bg-[#f4f4f4] text-[#000000]">
        <div className="max-w-6xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-3xl md:text-4xl lg:text-5xl font-bold mb-12 text-center"
          >
            Tailored for Every Role
          </motion.h2>
          <div className="flex flex-col sm:flex-row justify-center space-x-0 sm:space-x-4 mb-8">
            {useCases.map((useCase) => (
              <button
                key={useCase.role}
                onClick={() => setSelectedRole(useCase.role)}
                className={`w-full sm:w-auto px-6 py-2 rounded-full text-lg font-semibold transition-colors ${
                  selectedRole === useCase.role
                    ? "bg-[#cf4500] text-white"
                    : "bg-white text-[#cf4500] hover:bg-[#cf4500] hover:text-white"
                }`}
              >
                {useCase.role}
              </button>
            ))}
          </div>
          <AnimatePresence mode="wait">
            <motion.div
              key={selectedRole}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
              className="bg-white rounded-lg shadow-lg p-6"
            >
              <h3 className="text-2xl font-bold mb-4 text-[#cf4500]">
                {selectedRole} Features
              </h3>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {useCases
                  .find((uc) => uc.role === selectedRole)
                  .actions.map((action, index) => (
                    <motion.li
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center space-x-2"
                    >
                      <svg
                        className="w-6 h-6 text-green-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M5 13l4 4L19 7"
                        ></path>
                      </svg>
                      <span>{action}</span>
                    </motion.li>
                  ))}
              </ul>
            </motion.div>
          </AnimatePresence>
        </div>
      </section>

      {/* CTA Section */}
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 1 }}
        className="py-20 px-4 bg-[#cf4500] text-white text-center"
      >
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
            Transform Your Coding Education Today
          </h2>
          <p className="text-xl mb-12">
            Join the future of collaborative learning and elevate your teaching
            experience.
          </p>
          <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-4">
            <Link
              href="/sign-up"
              className="w-full sm:w-auto bg-[#cf4500] text-white py-3 px-8 rounded-full text-lg font-semibold hover:bg-[#ff5500] transition duration-300"
            >
              Get Started
            </Link>
            <Link
              href="/demo"
              className="w-full sm:w-auto bg-transparent border-2 border-white text-white py-3 px-8 rounded-full text-lg font-semibold hover:bg-white hover:text-[#323231] transition duration-300"
            >
              Schedule Demo
            </Link>
          </div>
        </div>
      </motion.section>

      {/* Footer */}
      <footer className="bg-[#000000] text-white py-12 px-4">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-xl font-semibold mb-4">Kolab</h3>
            <p className="text-sm">
              Empowering collaborative coding for the future of education.
            </p>
          </div>
          <div>
            <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/about"
                  className="hover:text-[#cf4500] transition-colors"
                >
                  About
                </Link>
              </li>
              <li>
                <Link
                  href="/features"
                  className="hover:text-[#cf4500] transition-colors"
                >
                  Features
                </Link>
              </li>
              <li>
                <Link
                  href="/pricing"
                  className="hover:text-[#cf4500] transition-colors"
                >
                  Pricing
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="hover:text-[#cf4500] transition-colors"
                >
                  Contact
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-lg font-semibold mb-4">Legal</h4>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/privacy"
                  className="hover:text-[#cf4500] transition-colors"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  href="/terms"
                  className="hover:text-[#cf4500] transition-colors"
                >
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-lg font-semibold mb-4">Connect</h4>
            <div className="flex space-x-4">
              <a
                href="https://github.com/kolab"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-[#cf4500] transition-colors"
              >
                <FaGithub size={24} />
              </a>
              <a
                href="https://twitter.com/kolab"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-[#cf4500] transition-colors"
              >
                <FaTwitter size={24} />
              </a>
              <a
                href="https://linkedin.com/company/kolab"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-[#cf4500] transition-colors"
              >
                <FaLinkedin size={24} />
              </a>
            </div>
          </div>
        </div>
        <div className="mt-8 text-center text-sm">
          <p>&copy; {new Date().getFullYear()} Kolab. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

const features = [
  {
    title: "Real-Time Collaboration",
    description:
      "Code together, learn together with instant pair programming and project rooms.",
    icon: "👥",
  },
  {
    title: "Live Monitoring",
    description:
      "Track student progress in real-time and provide immediate guidance.",
    icon: "🔍",
  },
  {
    title: "Integrated IDE",
    description:
      "Write, test, and debug code seamlessly within our powerful built-in environment.",
    icon: "💻",
  },
  {
    title: "Smart Task Management",
    description: "Create, assign, and track coding tasks with ease.",
    icon: "📝",
  },
  {
    title: "Instant Feedback",
    description: "Provide in-line comments and grades to accelerate learning.",
    icon: "💬",
  },
  {
    title: "Academic Integrity",
    description:
      "Ensure originality with our advanced plagiarism detection. (Coming Soon)",
    icon: "🔒",
  },
];

const steps = [
  {
    title: "Create Virtual Classrooms",
    description:
      "Set up your coding environment and invite students with just a few clicks.",
    svgSrc: "/class-svgrepo-com.svg",
  },
  {
    title: "Collaborate in Real-Time",
    description:
      "Engage in live coding sessions, pair programming, and interactive discussions.",
    svgSrc: "/collaborate-svgrepo-com.svg",
  },
  {
    title: "Monitor and Guide",
    description:
      "View student progress in real-time and provide instant feedback when needed.",
    svgSrc: "/monitor-alt-1-svgrepo-com.svg",
  },
  {
    title: "Evaluate and Improve",
    description:
      "Review submitted code, provide detailed feedback, and track student growth over time.",
    svgSrc: "/review-screen-svgrepo-com.svg",
  },
];

const useCases = [
  {
    role: "Teacher",
    actions: [
      "Create coding tasks",
      "Set deadlines",
      "Monitor students in real-time",
      "View student screens",
      "Provide instant feedback",
      "Conduct code reviews",
      "Assign grades",
      "Manage project deadlines",
      "Create virtual classrooms",
    ],
  },
  {
    role: "Student",
    actions: [
      "Collaborate in coding rooms",
      "Submit code for tasks",
      "Create personal projects",
      "Invite peers for pair programming",
      "Track progress on assignments",
      "Receive real-time feedback",
      "Join virtual classrooms",
    ],
  },
  {
    role: "Collaborator",
    actions: [
      "Work on shared projects",
      "Participate in pair programming",
      "Contribute to group tasks",
      "Engage in code discussions",
      "Join virtual classrooms",
    ],
  },
];

const allActions = [
  "Create coding tasks",
  "Set deadlines",
  "Monitor students in real-time",
  "View student screens",
  "Provide instant feedback",
  "Conduct code reviews",
  "Assign grades",
  "Manage project deadlines",
  "Create virtual classrooms",
  "Collaborate in coding rooms",
  "Submit code for tasks",
  "Create personal projects",
  "Invite peers for pair programming",
  "Track progress on assignments",
  "Receive real-time feedback",
  "Join virtual classrooms",
  "Work on shared projects",
  "Participate in pair programming",
  "Contribute to group tasks",
  "Engage in code discussions",
];

export default LandingPage;
