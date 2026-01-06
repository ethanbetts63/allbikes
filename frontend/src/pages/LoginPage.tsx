import { LoginForm } from "@/forms/LoginForm";
import Seo from '@/components/Seo';

const LoginPage = () => {
  return (
    <div className="bg-background flex h-full flex-col items-center justify-center">
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
