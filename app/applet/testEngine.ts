import { calculationEngine } from '../../services/calculationEngine';

async function test() {
  await calculationEngine.init();
  const elec = await calculationEngine.calculate('electricity', 112);
  const gas = await calculationEngine.calculate('gas', 61);
  console.log('Elec:', elec);
  console.log('Gas:', gas);
}
test();
