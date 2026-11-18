import {test,expect} from '@playwright/test';

test('Templates run in both workers and show concrete shared foundation output',async({page},info)=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/');
 await page.locator('#example-kind').selectOption('templates.tower');
 await expect(page.locator('#filename')).toHaveText('templates.tower');
 await expect(page.locator('#execution-output')).toHaveText('42\n9000000000\n7\n');
 await expect(page.locator('#llvm-output')).toHaveText('42\n9000000000\n7\n',{timeout:25000});
 await expect(page.locator('#core-instructions')).toContainText('struct `box(i32)`');
 await expect(page.locator('#core-instructions')).toContainText('fn `store(i32)`');
 await expect(page.locator('#core-instructions')).not.toContainText('T: type');
 await expect(page.locator('#execution-status')).toContainText('match');
 await page.screenshot({path:`../build/templates-${info.project.name}.png`});
 expect(errors).toEqual([]);
});
