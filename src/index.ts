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

			const keyboard = new InlineKeyboard()
				.url("Let's Go!", "https://t.me/TONStarsDAObot/app")
				.url("Subscribe to Channel", "https://t.me/tonstarsdao");

			const message = await ctx.replyWithPhoto("https://bot-assets.fra1.cdn.digitaloceanspaces.com/messages/ton-stars.jpg", {
				caption: `Welcome back, Space Cowboy! 🌠
You're now at the helm of your own interstellar adventure in TON Stars DAO. Here’s what you can do:

<b>Tap to Collect Quarks:</b> Start earning now by simply tapping!
<b>Evolve Quarks into Stars:</b> Use your Quarks to unlock Stars, our premium token that offers more power within our community.
<b>Learn and Earn in a Risk-Free zone:</b> Dive into the cosmos with zero investment. Educate yourself about the crypto, AI and earn rewards without any financial risk.

Don't miss another opportunity to be part of something groundbreaking. Start your journey today and become a key player in shaping the future of our universe!`,
				reply_markup: keyboard,
				parse_mode: "HTML"
			});

			if (ctx.chat && ctx.chat.id) {
				await ctx.api.pinChatMessage(ctx.chat.id, message.message_id);
			}
		});

		return webhookCallback(bot, "cloudflare-mod")(request);
	},
};
