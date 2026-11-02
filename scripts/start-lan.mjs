import { networkInterfaces } from 'node:os';
import { existsSync } from 'node:fs';
import { spawn } from 'node:child_process';

const addresses = [...new Set(Object.values(networkInterfaces()).flat()
  .filter(address => address && address.family === 'IPv4' && !address.internal)
  .map(address => address.address))];
const certificate = '.certs/lan.pem';
const key = '.certs/lan-key.pem';
const args = ['node_modules/@angular/cli/bin/ng.js', 'serve', '--ssl'];

if (existsSync(certificate) && existsSync(key)) {
  args.push('--ssl-cert', certificate, '--ssl-key', key);
} else {
  console.warn('Certificat local absent : Angular utilisera un certificat autosigné.');
  console.warn('Pour activer la caméra sur téléphone, configurez un certificat reconnu (voir README.md).');
}

console.log('FreshTrack sur le réseau local (téléphone connecté au même Wi-Fi) :');
for (const address of addresses) console.log(`  https://${address}:4200`);
console.log('Ouvrez cette adresse sur votre ordinateur pour que le QR code utilise aussi cette IP.');

const child = spawn(process.execPath, [...args, ...process.argv.slice(2)], { stdio: 'inherit' });
child.on('error', error => { console.error(error.message); process.exitCode = 1; });
child.on('exit', code => { process.exitCode = code ?? 1; });
