// app/page.tsx
import Link from 'next/link';
import { BookOpen, BarChart3, BrainCircuit, ShieldCheck } from 'lucide-react';

// A "glassmorphism" style feature card component
const FeatureCard = ({ icon, title, children }: { icon: React.ReactNode, title: string, children: React.ReactNode }) => (
  <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-100 hover:border-slate-200 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
    <div className="flex items-center justify-center w-14 h-14 bg-slate-100 text-slate-700 rounded-lg mb-6">
      {icon}
    </div>
    <h3 className="text-xl font-bold text-gray-900 mb-3">{title}</h3>
    <p className="text-gray-600 leading-relaxed">{children}</p>
  </div>
);

// The main landing page component with a dynamic and engaging design
export default function LandingPage() {
  return (
    <div className="bg-gray-50 text-gray-800">
      {/* Header */}
      <header className="absolute top-0 left-0 w-full z-20 p-4">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white tracking-wider">QuizMaster Pro</h1>
          <nav>
            <Link href="/login" className="bg-white/20 backdrop-blur-sm text-white font-semibold py-2 px-5 rounded-lg hover:bg-white/30 transition-all duration-300 shadow-md border border-white/20">
              Sign In
            </Link>
          </nav>
        </div>
      </header>
      
      {/* Hero Section with Subtle Gradient and Angled Bottom */}
      <section className="relative bg-gradient-to-br from-slate-800 via-slate-700 to-slate-900 text-white pt-40 pb-32 text-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-slate-800/10 to-slate-600/10"></div>
        <div className="container mx-auto px-4 relative z-10">
          <h2 className="text-5xl md:text-6xl font-extrabold mb-4 tracking-tight">
            The Future of Learning is Here
          </h2>
          <p className="text-xl text-slate-200 max-w-3xl mx-auto mb-10">
            Experience a new dimension of education with AI-driven quizzes and powerful analytics, built for tomorrow's leaders.
          </p>
          <Link href="/register" className="bg-white text-slate-800 font-bold py-4 px-10 rounded-lg text-lg hover:bg-slate-50 transition-all duration-300 shadow-lg transform hover:scale-105">
            Start Your Journey
          </Link>
        </div>
        {/* Angled separator */}
        <div 
          className="absolute bottom-0 left-0 w-full h-24 bg-gray-50"
          style={{ clipPath: 'polygon(0 100%, 100% 25%, 100% 100%)' }}
        ></div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h3 className="text-4xl font-bold text-gray-900 mb-4">An Unfair Advantage</h3>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              QuizMaster Pro isn't just a tool—it's your strategic partner in academic and professional excellence.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <FeatureCard icon={<BrainCircuit size={28} />} title="Instant Quizzes">
              From lecture notes to instant assessments. Our AI turns any document into an engaging quiz, freeing up valuable time.
            </FeatureCard>
            <FeatureCard icon={<BarChart3 size={28} />} title="Actionable Insights">
              Go beyond scores. Visualize performance trends, identify knowledge gaps, and track progress with our intuitive analytics.
            </FeatureCard>
            <FeatureCard icon={<BookOpen size={28} />} title="Centralized Content">
              Organize all your learning materials—subjects, chapters, and quizzes—in one unified, easy-to-navigate platform.
            </FeatureCard>
            <FeatureCard icon={<ShieldCheck size={28} />} title="Secure & Scalable">
              Built for institutions with role-based access for Admins, Teachers, and Students, ensuring data integrity and security.
            </FeatureCard>
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="bg-slate-900 text-white py-24">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto">
            <h3 className="text-4xl font-bold mb-4">
              Stop Guessing, Start Knowing.
            </h3>
            <p className="text-lg text-slate-300 mb-8">
              Whether you're preparing for an exam or empowering a classroom, QuizMaster Pro provides the clarity and tools you need to succeed.
            </p>
            <Link href="/register" className="bg-white text-slate-900 font-bold py-4 px-10 rounded-lg text-lg hover:bg-slate-50 transition-all duration-300 shadow-lg transform hover:scale-105">
              Claim Your Free Account
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white">
        <div className="container mx-auto py-8 px-4 text-center">
          <p className="text-gray-400">© {new Date().getFullYear()} QuizMaster Pro. All Rights Reserved.</p>
        </div>
      </footer>
    </div>
  );
}