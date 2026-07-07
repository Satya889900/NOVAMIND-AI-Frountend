import React from 'react';
import { AuthLayout } from '../../../components/auth/AuthLayout';
import { RegisterForm } from '../../../components/auth/RegisterForm';

export default function RegisterPage() {
  return (
    <AuthLayout
      title="Create account"
      subtitle="Join NovaMind and start chatting instantly"
    >
      <RegisterForm />
    </AuthLayout>
  );
}
