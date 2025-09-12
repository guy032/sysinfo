import { getAllInfo } from '.';

(async () => {
  console.log('test');
  const info = await getAllInfo({
    host: '10.100.102.20',
    username: 'winrmuser',
    password: 'newpassword',
    port: 5985,
  });

  console.log(JSON.stringify(info));

  console.log('getAllInfo');
  process.stdout.write('getAllInfo\n');
})();
