import { calculationEngine } from './services/calculationEngine.ts';

async function test() {
    await calculationEngine.init();
    const res = await calculationEngine.calculate('gas', 61, {});
    console.log(JSON.stringify(res, null, 2));
}
test();
