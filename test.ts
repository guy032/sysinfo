import { getAllInfo } from '.';

(async () => {
  console.log('test');
  const info = await getAllInfo({
    host: '10.100.102.20',
    username: 'winrmuser',
    password: 'guy132465',
    port: 5985,
  });

  console.log(JSON.stringify(info));

  console.log('getAllInfo');
  process.stdout.write('getAllInfo\n');
})();
