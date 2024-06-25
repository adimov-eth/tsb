import {Bot, Context, webhookCallback, InlineKeyboard} from "grammy";

export interface Env {
	tstars_user_meta: KVNamespace;
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
			const existingData = await env.tstars_user_meta.get(userId);
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
			}

			await env.tstars_user_meta.put(userId, JSON.stringify(userData));

			const keyboard = new InlineKeyboard().url("Open App", "https://example.com");

			const message = await ctx.replyWithPhoto("https://wp-s.ru/wallpapers/9/19/508322161627456/foto-zelenoj-doliny-na-fone-golubogo-neba.jpg", {
				caption: "Welcome to the app! Click the button below to open it.",
				reply_markup: keyboard
			});

			if (ctx.chat && ctx.chat.id) {
				await ctx.api.pinChatMessage(ctx.chat.id, message.message_id);
			}
		});

		return webhookCallback(bot, "cloudflare-mod")(request);
	},
};
