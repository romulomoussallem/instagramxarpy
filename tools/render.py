import sys, asyncio, shutil, os
from playwright.async_api import async_playwright
async def main(src, out, w, h):
    async with async_playwright() as p:
        exe = next((c for c in ["/usr/bin/google-chrome", shutil.which("chromium") or "", shutil.which("google-chrome") or ""] if c and os.path.exists(c)), None)
        b = await (p.chromium.launch(executable_path=exe, args=["--no-sandbox"]) if exe else p.chromium.launch(args=["--no-sandbox"]))
        pg = await b.new_page(viewport={"width": w, "height": h})
        await pg.goto("file://" + os.path.abspath(src)); await pg.wait_for_timeout(800)
        await pg.screenshot(path=out, type="jpeg", quality=92)
        await b.close()
asyncio.run(main(sys.argv[1], sys.argv[2], int(sys.argv[3]), int(sys.argv[4])))
