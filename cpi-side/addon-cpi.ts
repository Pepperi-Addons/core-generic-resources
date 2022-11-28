import '@pepperi-addons/cpi-node'


export const router = Router();

export async function load(configuration: any) {
    pepperi.events.intercept('SyncTerminated' as any, {}, async (data, next, main) => {
        if(!await global['app']['wApp']['isWebApp']()) {
        }
        await next(main);
    });
}

router.get('/base', async (req, res, next) => {
    let result = {};
    try {
        res.json(result);
    } catch (err) {
        console.log(err);
        next(err)
    }
});
