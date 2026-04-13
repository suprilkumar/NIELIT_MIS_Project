
import { 
  Building2, 
  Shield, 
  Users, 
  Target,
  Award,
  Globe,
  Clock,
  FileText
} from 'lucide-react';

export default function About() {
  const stats = [
    { value: '1,250+', label: 'Government Agencies', icon: Building2 },
    { value: '48', label: 'Countries', icon: Globe },
    { value: '99.9%', label: 'Uptime', icon: Clock },
    { value: 'ISO 27001', label: 'Certified', icon: Award },
  ];

  const values = [
    {
      icon: Shield,
      title: 'Security First',
      description: 'We prioritize data security and compliance above all else.'
    },
    {
      icon: Users,
      title: 'User-Centric',
      description: 'Designed with government employees and workflows in mind.'
    },
    {
      icon: Target,
      title: 'Mission Focused',
      description: 'Supporting government missions and public service.'
    },
    {
      icon: FileText,
      title: 'Transparency',
      description: 'Clear processes and auditable systems.'
    }
  ];

  return (
    <div className="min-h-screen flex flex-col">
      
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary-700 to-primary-800 text-white py-16 md:py-24">
        <div className="container-responsive">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              About GovDashboard
            </h1>
            <p className="text-xl opacity-90">
              A secure, scalable platform powering modern government administration
            </p>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 bg-white">
        <div className="container-responsive">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div key={index} className="text-center p-6">
                  <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Icon className="h-8 w-8 text-primary-600" />
                  </div>
                  <div className="text-3xl font-bold text-gray-900 mb-2">{stat.value}</div>
                  <div className="text-gray-600">{stat.label}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Mission */}
      <section className="py-16 bg-gray-50">
        <div className="container-responsive">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                Our Mission
              </h2>
              <p className="text-gray-600 mb-4">
                GovDashboard was established to provide government agencies with 
                a secure, reliable platform for digital transformation. Our mission 
                is to empower public servants with tools that enhance efficiency, 
                transparency, and service delivery.
              </p>
              <p className="text-gray-600 mb-4">
                In today's digital age, government agencies face increasing demands 
                for secure, accessible, and efficient services. GovDashboard addresses 
                these challenges head-on with enterprise-grade solutions.
              </p>
              <div className="mt-8 p-6 bg-primary-50 rounded-xl border border-primary-100">
                <h3 className="font-semibold text-primary-800 mb-2">
                  Official Statement
                </h3>
                <p className="text-gray-700">
                  "GovDashboard represents our commitment to modern, secure, and 
                  efficient government services for the 21st century."
                </p>
              </div>
            </div>
            <div className="bg-white rounded-2xl shadow-elevation-3 p-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">
                Core Values
              </h3>
              <div className="space-y-6">
                {values.map((value, index) => {
                  const Icon = value.icon;
                  return (
                    <div key={index} className="flex items-start space-x-4">
                      <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Icon className="h-6 w-6 text-primary-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-1">
                          {value.title}
                        </h4>
                        <p className="text-gray-600">{value.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-16 bg-white">
        <div className="container-responsive">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Timeline & Milestones
          </h2>
          <div className="max-w-4xl mx-auto">
            <div className="relative">
              {/* Vertical line */}
              <div className="absolute left-1/2 transform -translate-x-1/2 h-full w-0.5 bg-primary-200"></div>
              
              {[
                { year: '2018', title: 'Project Initiation', desc: 'Research and planning phase' },
                { year: '2019', title: 'Pilot Launch', desc: 'First agency implementation' },
                { year: '2020', title: 'ISO Certification', desc: 'Achieved ISO 27001 certification' },
                { year: '2021', title: 'National Rollout', desc: 'Expanded to federal agencies' },
                { year: '2023', title: 'Current Version', desc: 'Latest secure platform release' },
              ].map((milestone, index) => (
                <div 
                  key={index} 
                  className={`flex items-center mb-12 ${index % 2 === 0 ? 'flex-row' : 'flex-row-reverse'}`}
                >
                  <div className={`w-1/2 ${index % 2 === 0 ? 'pr-8 text-right' : 'pl-8'}`}>
                    <div className="card p-6">
                      <div className="text-primary-600 font-bold text-lg mb-2">
                        {milestone.year}
                      </div>
                      <h4 className="font-semibold text-gray-900 mb-2">
                        {milestone.title}
                      </h4>
                      <p className="text-gray-600 text-sm">
                        {milestone.desc}
                      </p>
                    </div>
                  </div>
                  <div className="relative w-4 h-4">
                    <div className="absolute w-4 h-4 bg-primary-600 rounded-full"></div>
                  </div>
                  <div className="w-1/2"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-primary-50">
        <div className="container-responsive">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">
              Ready to Learn More?
            </h2>
            <p className="text-gray-600 mb-8 text-lg">
              Contact our team for detailed information about implementation and security features.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <a
                href="/contact"
                className="btn-primary px-8 py-3"
              >
                Contact Us
              </a>
              <a
                href="/login"
                className="btn-secondary px-8 py-3"
              >
                Employee Login
              </a>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}