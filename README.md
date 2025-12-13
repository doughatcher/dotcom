# Dougie

**A versatile micro.blog theme by Doug Hatcher (who definitely doesn't go by Dougie)**

Dougie is a multi-purpose theme designed to power different types of micro.blog sites with the same codebase. Whether you need a microblog, a publication site, or a one-page portfolio, Dougie adapts to your needs through configuration alone.

## Philosophy

One theme, multiple personalities. Dougie transforms based on your configuration - no code changes required. Just adjust the settings in your `config.json` to switch between layouts and modes.

## Modes

### 1. **Microblog Mode** (Default)
A modern two-column layout perfect for personal microblogging:
- Sidebar with profile, avatar, bio, and social links
- Main content area with centered posts
- Micropost detection (< 280 characters get special styling)
- Timeline-style presentation
- Tag and syndication link support

### 2. **Publication Mode**
Transform your site into a professional publication:
- Header navigation instead of sidebar
- Featured posts and article listings
- Reading time and word count
- Category-focused organization
- Professional typography

### 3. **One-Page Mode**
Create a portfolio or landing page:
- Single scrolling page layout
- Section-based design
- Perfect for personal portfolios
- About, work, and contact sections
- Minimal, focused presentation

## Features

- ✨ **Highly Configurable**: Switch modes and styles via config.json
- 📱 **Fully Responsive**: Works beautifully on all devices
- 🌙 **Dark Mode Support**: Automatic theme switching
- 🎨 **CSS Custom Properties**: Easy color and style customization
- ⚡ **Smart Content Centering**: Adapts to content height
- 🏷️ **Micropost Detection**: Special styling for short posts
- 🔗 **Social Media Integration**: Support for all major platforms
- 📊 **Publication Features**: Word count, reading time, categories
- 🎯 **SEO Optimized**: Proper meta tags and structured data

## Installation

### For Micro.blog Hosted Sites
1. Go to your micro.blog Design settings
2. Click "Edit Custom Theme"
3. Upload or clone this repository
4. Configure your desired mode in `config.json`

### For Self-Hosted Hugo Sites
```bash
git clone https://github.com/doughatcher/micro.blog.git themes/dougie
```

## Configuration

### Switching Modes

Add to your `config.json`:

```json
{
  "params": {
    "theme_mode": "microblog",  // Options: "microblog", "publication", "onepage"
    "show_avatar": true,
    "show_bio": true,
    "show_social_links": true,
    "sidebar_width": "400px"
  }
}
```

### Microblog Configuration

```json
{
  "params": {
    "theme_mode": "microblog",
    "author": {
      "name": "Your Name",
      "avatar": "https://your-avatar-url.jpg",
      "username": "yourusername"
    },
    "bio": "Your bio here",
    "show_avatar": true,
    "show_bio": true,
    "show_social_links": true,
    "show_word_count": false,
    "show_reading_time": false,
    "posts_per_page": 20,
    "twitter_username": "yourhandle",
    "github_username": "yourhandle",
    "mastodon_url": "https://mastodon.social/@you"
  }
}
```

### Publication Configuration

```json
{
  "params": {
    "theme_mode": "publication",
    "publication_name": "Your Publication",
    "show_word_count": true,
    "show_reading_time": true,
    "show_categories": true,
    "show_featured": true,
    "posts_per_page": 10
  }
}
```

### One-Page Configuration

```json
{
  "params": {
    "theme_mode": "onepage",
    "sections": ["about", "work", "contact"],
    "show_nav": true,
    "hero_title": "Your Name",
    "hero_subtitle": "What you do"
  }
}
```

## Customization

### Colors & Styling

The theme uses CSS Custom Properties for easy customization. Edit `static/css/main.css`:

```css
:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --primary: 221.2 83.2% 53.3%;
  /* ... and many more */
}
```

### Custom CSS

Add your custom styles to `static/custom.css` - this file is loaded after the main stylesheet.

## Design System

Dougie uses a modern design system inspired by shadcn/ui:
- **Typography**: Inter for sans-serif, JetBrains Mono for monospace
- **Colors**: HSL-based color system for easy theming
- **Spacing**: Consistent rem-based spacing scale
- **Components**: Reusable, well-structured component classes

## Browser Support

- Chrome/Edge (latest 2 versions)
- Firefox (latest 2 versions)
- Safari (latest 2 versions)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Credits

- **Created by**: Doug Hatcher ([@hatcher](https://micro.blog/hatcher))
- **Based on**: [theme-blank](https://github.com/microdotblog/theme-blank) by Micro.blog
- **Design inspiration**: shadcn/ui design system
- **Named after**: Absolutely nobody - Doug doesn't go by Dougie

## Automated Deployment

This theme uses GitHub Actions for automated deployment to Micro.blog when template files change.

### How It Works

Changes to theme files automatically trigger deployment:
- `layouts/**` - Template files
- `static/**` - CSS, JavaScript, images
- `theme.toml` - Theme configuration
- `plugin.json` - Plugin configuration

The workflow:
1. Authenticates to Micro.blog via email (using cached session cookie)
2. Triggers theme reload from GitHub
3. Rebuilds your site
4. Monitors completion (~1-2 minutes)

### Setup Instructions

**Required GitHub Secrets & Variables:**

Secrets (encrypted):
- `GMAIL_APP_PASSWORD` - Gmail app password for authentication

Variables (configuration):
- `GMAIL_EMAIL` - Gmail address for receiving sign-in emails
- `MICROBLOG_EMAIL` - Your Micro.blog account email
- `MICROBLOG_SITE_ID` - Your Micro.blog site ID
- `MICROBLOG_THEME_ID` - Your theme ID

**Step-by-step setup:**

1. **Get Gmail App Password**:
   - Enable 2-factor auth at https://myaccount.google.com/security
   - Create app password at https://myaccount.google.com/apppasswords
   - Name it "Micro.blog Theme Deploy"

2. **Find Your Micro.blog IDs**:
   - **Site ID**: Visit https://micro.blog/account, check site settings URL
   - **Theme ID**: Go to Design → Edit Custom Themes, check theme URL

3. **Configure GitHub Secrets**:
   - Go to your repo Settings → Secrets and variables → Actions
   - Add secret: `GMAIL_APP_PASSWORD`
   - Add variables: `GMAIL_EMAIL`, `MICROBLOG_EMAIL`, `MICROBLOG_SITE_ID`, `MICROBLOG_THEME_ID`

4. **Test Deployment**:
   - Make a small change to a template file
   - Commit and push to `main` branch
   - Check Actions tab for workflow status

**Manual Deployment:**

Trigger deployment manually from the Actions tab → "Deploy to Micro.blog" → "Run workflow"

For more details, see [.github/deploy/README.md](.github/deploy/README.md).

## License

MIT License - See [LICENSE](LICENSE) for details

## Support

- **Issues**: [GitHub Issues](https://github.com/doughatcher/micro.blog/issues)
- **Micro.blog**: [@hatcher](https://micro.blog/hatcher)
- **Website**: [doughatcher.com](https://doughatcher.com)

---

*Built with ❤️ for the Micro.blog community*
