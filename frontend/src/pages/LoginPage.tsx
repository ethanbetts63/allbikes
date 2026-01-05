import { LoginForm } from "@/forms/LoginForm";
import Seo from '@/components/Seo';

const LoginPage = () => {
  return (
    <div className="bg-background flex h-screen flex-col items-center justify-center p-6 md:p-10">
      <Seo
        title="Admin Login | Allbikes"
        description="Login to the Allbikes administration dashboard."
        canonicalPath="/login"
        noindex={true}
      />
      <LoginForm />
    </div>
  );
};

export default LoginPage;
