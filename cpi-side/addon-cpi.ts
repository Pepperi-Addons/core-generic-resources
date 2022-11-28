import '@pepperi-addons/cpi-node'


export const router = Router();

export async function load(configuration: any) {
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
