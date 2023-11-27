import { useState, FormEvent } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/router';

export default function Home() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter(); 

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault(); 
    const result = await signIn('credentials', {
      redirect: false,
      email,
      password
    });

    if (result && !result.error) {
      console.log('Signed in successfully!');
      router.push('/dashboard'); 
    } else if (result) {
      console.error('Failed to sign in:', result.error);
    }
  };

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <div>
          <input
            placeholder="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className='text-black'
          />
        </div>

        <div>
          <input
            placeholder="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className='text-black'
          />
        </div>

        <div>
          <button type="submit">Sign In</button>
        </div>
      </form>
    </div>
  );
}
