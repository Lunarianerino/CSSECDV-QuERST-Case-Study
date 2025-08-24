import RegisterForm from "@/components/auth/register/register-form";
import {QuerstCarousel} from "@/components/landing/carousell";

export default function Page() {
  return (
    <main>
      <div className="flex md:flex-row flex-col md:m-15 m-5 gap-5">
        <div className="flex-1/2 max-h-screen mt-5 mb-5 overflow-hidden">
          <QuerstCarousel />
        </div>
        <div id="preregister" className="text-center h-screen max-h-screen md:max-w-2xl animate-fade-in content-center">
          <p className="text-4xl lg:text-5xl text-green-900 m-5">
            Pre-register now to the premier <span className="bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">volunteer-driven</span> tutoring platform.
          </p>
          <RegisterForm isRedirectEnabled={false} />
            <div className="mt-5">
                Already have an account? <a className="text-blue-600 hover:text-blue-700 underline" href="/login">Login here.</a>
            </div>
        </div>
      </div>
    </main>

  )
}
