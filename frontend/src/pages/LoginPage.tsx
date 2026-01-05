import { LoginForm } from "@/forms/LoginForm";
import Seo from '@/components/Seo';

const LoginPage = () => {
  return (
    <div className="bg-background flex h-screen flex-col items-center justify-start py-10">
      <Seo
        title="Admin Login | Allbikes Vespa Warehouse"
        description="Login to the Allbikes Vespa Warehouse administration dashboard."
        canonicalPath="/login"
        noindex={true}
      />
      <LoginForm />
    </div>
  );
};

export default LoginPage;
