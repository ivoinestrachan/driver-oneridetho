import { useEffect, useState, FormEvent } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/router';

export default function Home() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState(''); 
  const router = useRouter(); 
  const { data: session, status } = useSession();

  useEffect(() => {
    if (session) {
      router.push('/dashboard');
    }
  }, [session, router]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault(); 
    setLoginError('');
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
      setLoginError('Invalid credentials. Please try again.'); 
    }
  };

  if (status === 'loading') {
    return <p>Loading...</p>;
  }


  return (
    <div>
      <form onSubmit={handleSubmit}>
        <div>
          <input
            placeholder="email"
            type="email"
            value={email}
            autoComplete='off'
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
      {loginError && <div className="text-red-500">{loginError}</div>}
    </div>
  );
}
