import React from 'react';
import Layout from '@/components/layout/Layout';
import FeedbackForm from '@/components/FeedbackForm';

export default function FeedbackPage() {
  return (
    <Layout>
      <div className="py-12">
        <h1 className="text-2xl font-bold mb-6 text-center">Feedback</h1>
        <FeedbackForm />
      </div>
    </Layout>
  );
}
