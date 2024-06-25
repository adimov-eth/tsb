import {Bot, Context, webhookCallback} from "grammy";

export interface Env {
	TSTARS_SESSION: KVNamespace;
	TSTARS_LEADERS: KVNamespace;
	BOT_INFO: string;
	BOT_TOKEN: string;
}

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		const bot = new Bot(env.BOT_TOKEN, {botInfo: JSON.parse(env.BOT_INFO)});

		bot.command("start", async (ctx: Context) => {
			if (!ctx.from || !ctx.from.id) {
				await ctx.reply("Error: Unable to retrieve user information.");
				return;
			}

			const userId = ctx.from.id.toString();

			const existingData = await env.TSTARS_SESSION.get(userId);
			let userData = existingData ? JSON.parse(existingData) : {};

			userData = {
				...userData,
				...ctx.from
			};

			const photos = await bot.api.getUserProfilePhotos(ctx.from.id);

			if (photos.total_count > 0) {
				const photo = photos.photos[0][0];
				const fileId = photo.file_id;

				const file = await bot.api.getFile(fileId);
				const fileUrl = `https://api.telegram.org/file/bot${env.BOT_TOKEN}/${file.file_path}`;

				userData.photo_url = fileUrl;

				await ctx.reply(`Hello!`);
			}

			await env.TSTARS_SESSION.put(userId, JSON.stringify(userData));
		});

		return webhookCallback(bot, "cloudflare-mod")(request);
	},
};
