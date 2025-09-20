// Firebase config (replace with your own config)
const firebaseConfig = {
	apiKey: "AIzaSyDd5sGQghCYSuKKz_s7md45vBdYbnUWCjk",
	authDomain: "wauthak.firebaseapp.com",
	projectId: "wauthak",
	storageBucket: "wauthak.firebasestorage.app",
	messagingSenderId: "438985293595",
	appId: "1:438985293595:web:cf56d46661e144e371ddbe",
	measurementId: "G-3336J0N017"
};
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();

const googleBtn = document.getElementById('googleLoginBtn');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');

if (googleBtn) {
	googleBtn.addEventListener('click', async () => {
		const provider = new firebase.auth.GoogleAuthProvider();
		try {
			const result = await auth.signInWithPopup(provider);
			const idToken = await result.user.getIdToken();
			const res = await fetch('/api/login', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ idToken })
			});
			if (res.ok) {
				window.location.replace('/dashboard');
			} else {
				if (document.getElementById('loginError')) {
					document.getElementById('loginError').innerText = 'Google login failed.';
				}
				if (document.getElementById('registerError')) {
					document.getElementById('registerError').innerText = 'Google login failed.';
				}
			}
		} catch (err) {
			if (document.getElementById('loginError')) {
				document.getElementById('loginError').innerText = err.message;
			}
			if (document.getElementById('registerError')) {
				document.getElementById('registerError').innerText = err.message;
			}
		}
	});
}

if (loginForm) {
	loginForm.addEventListener('submit', async (e) => {
		e.preventDefault();
		const email = document.getElementById('email').value;
		const password = document.getElementById('password').value;
		try {
			const userCred = await auth.signInWithEmailAndPassword(email, password);
			const idToken = await userCred.user.getIdToken();
			const res = await fetch('/api/login', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ idToken })
			});
			if (res.ok) {
				window.location.replace('/dashboard');
			} else {
				document.getElementById('loginError').innerText = 'Login failed.';
			}
		} catch (err) {
			document.getElementById('loginError').innerText = err.message;
		}
	});
}

if (registerForm) {
	registerForm.addEventListener('submit', async (e) => {
		e.preventDefault();
		const email = document.getElementById('email').value;
		const password = document.getElementById('password').value;
		try {
			await auth.createUserWithEmailAndPassword(email, password);
			// Auto-login after register
			const userCred = await auth.signInWithEmailAndPassword(email, password);
			const idToken = await userCred.user.getIdToken();
			const res = await fetch('/api/login', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ idToken })
			});
			if (res.ok) {
				window.location.href = '/dashboard';
			} else {
				document.getElementById('registerError').innerText = 'Register failed.';
			}
		} catch (err) {
			document.getElementById('registerError').innerText = err.message;
		}
	});
}