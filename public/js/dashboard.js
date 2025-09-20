// Tab switching
const tabs = ['2fa', 'passwords', 'ids', 'account', 'sync'];
tabs.forEach(tab => {
	document.getElementById('tab-' + tab)?.addEventListener('click', () => {
		tabs.forEach(t => {
			document.getElementById('tab-' + t)?.classList.remove('active');
			document.getElementById('content-' + t).style.display = 'none';
		});
		document.getElementById('tab-' + tab)?.classList.add('active');
		document.getElementById('content-' + tab).style.display = 'block';
	});
});

// 2FA CRUD
async function loadTotp() {
	const res = await fetch('/api/totp');
	const data = await res.json();
	const list = document.getElementById('totp-list');
	list.innerHTML = '';
	data.forEach(t => {
		const el = document.createElement('div');
		el.innerHTML = `<b>${t.name}</b> <span>${t.secret}</span> <button onclick="deleteTotp(${t.id})">Delete</button>`;
		list.appendChild(el);
	});
}
window.deleteTotp = async function(id) {
	await fetch('/api/totp/' + id, { method: 'DELETE' });
	loadTotp();
}
document.getElementById('addTotpForm')?.addEventListener('submit', async e => {
	e.preventDefault();
	const name = document.getElementById('totpName').value;
	const secret = document.getElementById('totpSecret').value;
	await fetch('/api/totp', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, secret }) });
	loadTotp();
});
loadTotp();

// Passwords CRUD
async function loadPasswords() {
	const res = await fetch('/api/passwords');
	const data = await res.json();
	const list = document.getElementById('passwords-list');
	if (!list) return;
	list.innerHTML = '';
	data.forEach(p => {
		const el = document.createElement('div');
		el.innerHTML = `<b>${p.site}</b> <span>${p.username}</span> <span>${p.password}</span> <button onclick="deletePassword(${p.id})">Delete</button>`;
		list.appendChild(el);
	});
}
window.deletePassword = async function(id) {
	await fetch('/api/passwords/' + id, { method: 'DELETE' });
	loadPasswords();
}
document.getElementById('addPasswordForm')?.addEventListener('submit', async e => {
	e.preventDefault();
	const site = document.getElementById('site').value;
	const username = document.getElementById('username').value;
	const password = document.getElementById('password').value;
	await fetch('/api/passwords', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ site, username, password }) });
	loadPasswords();
});
loadPasswords();

// IDs CRUD
async function loadIds() {
	const res = await fetch('/api/ids');
	const data = await res.json();
	const list = document.getElementById('ids-list');
	if (!list) return;
	list.innerHTML = '';
	data.forEach(i => {
		const el = document.createElement('div');
		el.innerHTML = `<b>${i.id_name}</b> <span>${i.id_value}</span> <button onclick="deleteId(${i.id})">Delete</button>`;
		list.appendChild(el);
	});
}
window.deleteId = async function(id) {
	await fetch('/api/ids/' + id, { method: 'DELETE' });
	loadIds();
}
document.getElementById('addIdForm')?.addEventListener('submit', async e => {
	e.preventDefault();
	const id_name = document.getElementById('idName').value;
	const id_value = document.getElementById('idValue').value;
	await fetch('/api/ids', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id_name, id_value }) });
	loadIds();
});
loadIds();

// Account settings
document.getElementById('logoutBtn')?.addEventListener('click', async () => {
	await fetch('/api/logout', { method: 'POST' });
	window.location.href = '/login';
});
document.getElementById('changePasswordBtn')?.addEventListener('click', async () => {
	await fetch('/api/change-password', { method: 'POST' });
	document.getElementById('accountMsg').innerText = 'Password change requested.';
});

// Export/Import
document.getElementById('exportBtn')?.addEventListener('click', async () => {
	const res = await fetch('/api/export');
	const data = await res.json();
	const json = JSON.stringify(data);
	// Show QR code or copy to clipboard
	alert('Exported data: ' + json);
});
document.getElementById('importForm')?.addEventListener('submit', async e => {
	e.preventDefault();
	const importData = document.getElementById('importData').value;
	try {
		const data = JSON.parse(importData);
		await fetch('/api/import', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
		document.getElementById('syncMsg').innerText = 'Import successful!';
		loadTotp(); loadPasswords(); loadIds();
	} catch (err) {
		document.getElementById('syncMsg').innerText = 'Import failed.';
	}
});

// QR scan integration
document.getElementById('scanQrBtn')?.addEventListener('click', () => {
	document.getElementById('qrScanner').style.display = 'block';
	// qr-scanner.js will handle camera
});