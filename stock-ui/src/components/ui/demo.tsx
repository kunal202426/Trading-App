import { AnimatedCharactersLoginPage } from "@/components/ui/animated-characters-login-page";

export default function DemoOne() {
  return (
    <AnimatedCharactersLoginPage
      email=""
      password=""
      onEmailChange={() => undefined}
      onPasswordChange={() => undefined}
      onSubmit={(e) => e.preventDefault()}
      onGoogleLogin={() => undefined}
    />
  );
}
