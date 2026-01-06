import { LoginForm } from "@/forms/LoginForm";
import Seo from '@/components/Seo';

const LoginPage = () => {
  return (
    <div className="bg-background flex h-full flex-col items-center justify-center py-12">
      <Seo
        title="Admin Login | Allbikes Vespa Warehouse"
        description="Login to the Allbikes Vespa Warehouse administration dashboard."
        canonicalPath="/login"
        noindex={true}
      />
      <LoginForm className="w-full max-w-lg" />
    </div>
  );
};

export default LoginPage;
