import AuthForm from '../components/AuthForm';

export default function AuthPage() {
  return (
    <div className="bg-slate-50 min-h-[calc(100vh-64px)] flex items-center justify-center font-sans">
      <AuthForm />
    </div>
  );
}