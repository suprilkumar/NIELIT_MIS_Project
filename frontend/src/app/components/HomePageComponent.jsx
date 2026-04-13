import { 
  Shield, 
  Lock, 
  Users, 
  BarChart3,
  FileText,
  Globe,
  ArrowRight,
  CheckCircle,
  Building2
} from 'lucide-react';
import Link from 'next/link';

export default function HomePageComponent() {
  const features = [
    {
      icon: Shield,
      title: 'Secure Authentication',
      description: 'Military-grade encryption and multi-factor authentication for maximum security.',
      color: 'bg-blue-100 text-blue-600'
    },
    {
      icon: Lock,
      title: 'Role-Based Access',
      description: 'Granular permission system with admin, operator, and user roles.',
      color: 'bg-green-100 text-green-600'
    },
    {
      icon: Users,
      title: 'User Management',
      description: 'Comprehensive user administration and activity monitoring.',
      color: 'bg-purple-100 text-purple-600'
    },
    {
      icon: BarChart3,
      title: 'Analytics Dashboard',
      description: 'Real-time analytics and reporting tools for data-driven decisions.',
      color: 'bg-orange-100 text-orange-600'
    },
    {
      icon: FileText,
      title: 'Document Management',
      description: 'Secure document storage, sharing, and collaboration platform.',
      color: 'bg-red-100 text-red-600'
    },
    {
      icon: Globe,
      title: 'Multi-Platform',
      description: 'Accessible from desktop, tablet, and mobile devices.',
      color: 'bg-indigo-100 text-indigo-600'
    }
  ];

  return (
    <div className="min-h-screen flex flex-col">
      
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary-50 to-white section-padding">
        <div className="container-responsive">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8 animate-fade-in">
              <div className="space-y-4">
                <div className="inline-flex items-center space-x-2 bg-primary-100 text-primary-700 px-4 py-2 rounded-full text-sm font-medium">
                  <Shield className="h-4 w-4" />
                  <span>Official Government Portal</span>
                </div>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                  Secure Government
                  <span className="text-primary-600"> Dashboard</span>
                  <span className="block text-3xl md:text-4xl text-gray-600 mt-2">
                    For Modern Administration
                  </span>
                </h1>
                <p className="text-lg text-gray-600 max-w-2xl">
                  A comprehensive, secure platform designed for government agencies 
                  and large organizations. Manage users, documents, and analytics 
                  with enterprise-grade security.
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/register"
                  className="btn-primary flex items-center justify-center space-x-2 group"
                >
                  <span>Create Account</span>
                  <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link
                  href="/login"
                  className="btn-secondary flex items-center justify-center"
                >
                  Sign In to Portal
                </Link>
              </div>
              
              <div className="flex flex-wrap gap-6 text-sm text-gray-500">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-accent-500" />
                  <span>ISO 27001 Certified</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-accent-500" />
                  <span>GDPR Compliant</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-accent-500" />
                  <span>24/7 Support</span>
                </div>
              </div>
            </div>
            
            <div className="relative">
              <div className="bg-white rounded-2xl shadow-elevation-4 p-8 border border-gray-200">
                <div className="space-y-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
                      <Building2 className="h-6 w-6 text-primary-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">Official Portal Access</h3>
                      <p className="text-sm text-gray-500">Secure login required</p>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="bg-gray-50 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">Government Employees</span>
                        <span className="text-sm font-bold text-primary-600">1,250+</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-primary-600 h-2 rounded-full w-3/4"></div>
                      </div>
                    </div>
                    
                    <div className="bg-gray-50 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">Active Departments</span>
                        <span className="text-sm font-bold text-primary-600">48</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-green-500 h-2 rounded-full w-2/3"></div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t border-gray-200">
                    <h4 className="font-semibold text-gray-900 mb-3">Quick Access</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <Link
                        href="/login"
                        className="bg-primary-50 text-primary-700 px-4 py-3 rounded-lg text-center font-medium hover:bg-primary-100 transition-colors"
                      >
                        Employee Login
                      </Link>
                      <Link
                        href="/register"
                        className="bg-gray-100 text-gray-700 px-4 py-3 rounded-lg text-center font-medium hover:bg-gray-200 transition-colors"
                      >
                        New Registration
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="section-padding bg-white">
        <div className="container-responsive">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Enterprise Features
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Built with security and scalability for government and large organizations
            </p>
          </div>
          
          <div className="grid-responsive">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div 
                  key={index} 
                  className="card p-6 hover:shadow-elevation-3 transition-shadow animate-slide-up"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className={`${feature.color} w-12 h-12 rounded-xl flex items-center justify-center mb-4`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-primary-700 to-primary-800 text-white section-padding">
        <div className="container-responsive">
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Ready to Get Started?
            </h2>
            <p className="text-lg mb-8 opacity-90">
              Join thousands of government agencies and organizations using our secure platform
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link
                href="/register"
                className="bg-white text-primary-700 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
              >
                Request Access
              </Link>
              <Link
                href="/contact"
                className="bg-transparent border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white/10 transition-colors"
              >
                Contact Sales
              </Link>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}