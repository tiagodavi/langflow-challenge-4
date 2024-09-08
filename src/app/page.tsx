import Image from 'next/image';
import Link from 'next/link';

export default function Login() {
  return (
    <main className="bg-gray-100 flex items-center justify-center min-h-screen">
    <div className="bg-white rounded-lg shadow-lg flex w-full max-w-4xl">
      <div className="w-1/2 bg-[#3b0918] rounded-l-lg p-8 flex flex-col justify-center items-center">

          <Image
          src="/logo.jpeg"  // Path to your image relative to the public directory
          alt="Lang Quiz"
          width={150}          // Desired width
          height={150}
          className="mb-6 rounded-full w-40 h-40 object-cover"         // Desired height
        />

        <h2 className="text-white text-2xl font-semibold mb-4 text-center">
          Welcome to Lang Quiz <br />
          A smarter way of studying
        </h2>
        <p className="text-blue-100 text-center">
          Our innovative platform empowers users to create custom quizzes based on any document.
        </p>
      </div>
      <div className="w-1/2 p-8">
        <h2 className="text-2xl font-semibold text-gray-800 text-center mb-6">
          Login to Your Account
        </h2>
        <form>
          <div className="mb-4">
            <label className="block text-gray-600 mb-2" for="email">Email</label>
            <input className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-transparent" type="email" id="email" placeholder="Enter your email" />
          </div>
          <div className="mb-6">
            <label className="block text-gray-600 mb-2" for="password">Password</label>
            <input className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-transparent" type="password" id="password" placeholder="Enter your password" />
            <p className="text-right text-blue-500 hover:underline mt-2">
              <a href="#">Forgot your password?</a>
            </p>
          </div>

          <Link
            href="/quiz"
            className="block w-full bg-[#3b0918] text-white font-semibold py-3 rounded-lg text-center focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-50 transition duration-200">
            Login
          </Link>

          <p className="text-center text-gray-600 mt-6">
            Don't have an account? <a href="#" className="text-blue-500 hover:underline">Sign up</a>
          </p>
        </form>
      </div>
    </div>
  </main>
  );
}
