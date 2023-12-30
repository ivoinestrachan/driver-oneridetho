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
    <>
    <div className='flex justify-center mt-[150px]'>
      <form onSubmit={handleSubmit}  className='space-y-4'>
        <div>
          <input
            placeholder="email"
            type="email"
            value={email}
            autoComplete='off'
            onChange={(e) => setEmail(e.target.value)}
            className="border outline-none py-3 pl-3 w-[300px] border-gray-200 rounded-md "
          />
        </div>

        <div>
          <input
            placeholder="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="border outline-none py-3 pl-3 w-[300px] border-gray-200 rounded-md "
          />
        </div>

        <div>
          <button type="submit" className="bg-black py-3 pl-[130px] pr-[130px] text-white rounded-md"
>Sign In</button>
        </div>
      </form>
    
    </div>
      {loginError && <div className="text-red-500 text-center mt-5">{loginError}</div>}
      </>
  );
}
