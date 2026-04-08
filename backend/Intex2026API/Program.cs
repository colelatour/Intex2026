using Intex2026API.Controllers;
using Intex2026API.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Identity;
using DotNetEnv;
using Microsoft.AspNetCore.Authentication.Google;

static string? FindDotEnvFile()
{
    var tried = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
    bool tryPath(string path)
    {
        try
        {
            path = Path.GetFullPath(path);
            return tried.Add(path) && File.Exists(path);
        }
        catch
        {
            return false;
        }
    }

    var cwdEnv = Path.Combine(Directory.GetCurrentDirectory(), ".env");
    if (tryPath(cwdEnv))
        return Path.GetFullPath(cwdEnv);

    foreach (var root in new[] { Directory.GetCurrentDirectory(), AppContext.BaseDirectory })
    {
        try
        {
            var dir = new DirectoryInfo(root);
            for (var i = 0; i < 12 && dir != null; i++)
            {
                var candidate = Path.Combine(dir.FullName, ".env");
                if (tryPath(candidate))
                    return Path.GetFullPath(candidate);
                dir = dir.Parent;
            }
        }
        catch
        {
            // ignore
        }
    }

    return null;
}

// Load backend/.env even when `dotnet run` cwd is Intex2026API (walks up to repo / backend).
var dotEnvPath = FindDotEnvFile();
if (dotEnvPath != null)
{
    Env.Load(dotEnvPath, new LoadOptions(setEnvVars: true, clobberExistingVars: true, onlyExactPath: false));
}

var builder = WebApplication.CreateBuilder(args);

var googleClientId = builder.Configuration["Authentication:Google:ClientId"];
var googleClientSecret = builder.Configuration["Authentication:Google:ClientSecret"];

// Add services to the container.

builder.Services.AddControllers();
// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();

var allowedOrigins = builder.Configuration.GetSection("AllowedOrigins").Get<string[]>()
    ?? new[] { "http://localhost:3000", "http://localhost:5173" };

var lighthouseConnection = builder.Configuration.GetConnectionString("LighthouseConnection");
var identityConnection = builder.Configuration.GetConnectionString("LighthouseIdentityConnection");
if (string.IsNullOrWhiteSpace(lighthouseConnection))
{
    throw new InvalidOperationException(
        "ConnectionStrings:LighthouseConnection is missing or empty. Set it in appsettings.json or in a .env file " +
        "(e.g. backend/.env) as ConnectionStrings__LighthouseConnection=... so it is found when you run from Intex2026API.");
}

if (string.IsNullOrWhiteSpace(identityConnection))
{
    throw new InvalidOperationException(
        "ConnectionStrings:LighthouseIdentityConnection is missing or empty. Set it in appsettings.json or in backend/.env " +
        "as ConnectionStrings__LighthouseIdentityConnection=...");
}

if (!string.IsNullOrEmpty(googleClientId) && !string.IsNullOrEmpty(googleClientSecret))
{
    builder.Services.AddAuthentication()
    .AddGoogle(options =>
    {
        options.ClientId = googleClientId;
        options.ClientSecret = googleClientSecret;
        options.SignInScheme = IdentityConstants.ExternalScheme;
        options.CallbackPath = "/signin-google";
    });
}

builder.Services.AddCors(options =>
{
    options.AddPolicy("frontend", policy =>
    {
        policy.WithOrigins(allowedOrigins)
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});

builder.Services.AddDbContext<LighthouseContext>(options =>
{
    options.UseSqlServer(
        lighthouseConnection,
        sql => sql.EnableRetryOnFailure(5, TimeSpan.FromSeconds(10), null));
});
builder.Services.AddDbContext<AuthIdentityDbContext>(options =>
{
    options.UseSqlServer(
        identityConnection,
        sql => sql.EnableRetryOnFailure(5, TimeSpan.FromSeconds(10), null));
});

builder.Services.AddIdentity<ApplicationUser, IdentityRole>(options =>
{
    // Password policy — 14 characters minimum, no complexity requirements
    options.Password.RequiredLength = 14;
    options.Password.RequireDigit = false;
    options.Password.RequireNonAlphanumeric = false;
    options.Password.RequireLowercase = false;
    options.Password.RequireUppercase = false;
    options.Password.RequiredUniqueChars = 1;
})
.AddEntityFrameworkStores<AuthIdentityDbContext>()
.AddDefaultTokenProviders();

builder.Services.ConfigureApplicationCookie(options =>
{
    options.Cookie.HttpOnly = true;
    options.Cookie.SameSite = SameSiteMode.None;
    options.Cookie.SecurePolicy = CookieSecurePolicy.Always;
    options.Cookie.Name = "SafeHavenAuth";
    options.Events.OnRedirectToLogin = context =>
    {
        context.Response.StatusCode = 401;
        return Task.CompletedTask;
    };
});

var app = builder.Build();

// Ensure Identity database is created and seed roles/admin
using (var scope = app.Services.CreateScope())
{
    var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();
    try
    {
        var roleManager = scope.ServiceProvider.GetRequiredService<RoleManager<IdentityRole>>();
        var userManager = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();

        string[] roles = { "Admin", "Worker", "Donor" };
        foreach (var role in roles)
        {
            if (!await roleManager.RoleExistsAsync(role))
                await roleManager.CreateAsync(new IdentityRole(role));
        }

        // Seed a default admin from environment variables (or fallback for dev)
        var adminEmail = builder.Configuration["AdminEmail"] ?? "admin@safehaven.org";
        // Keep the dev fallback password aligned with the configured Identity password policy (>= 14 chars).
        var adminPassword = builder.Configuration["AdminPassword"] ?? "Admin123!@#4567";
        var adminUser = await userManager.FindByEmailAsync(adminEmail);
        if (adminUser == null)
        {
            adminUser = new ApplicationUser { UserName = adminEmail, Email = adminEmail };
            var result = await userManager.CreateAsync(adminUser, adminPassword);
            if (result.Succeeded)
                await userManager.AddToRoleAsync(adminUser, "Admin");
        }
    }
    catch (Exception ex)
    {
        logger.LogError(ex, "Failed to initialize Identity database. Auth endpoints may not work.");
    }
}

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}


app.UseHttpsRedirection();

// CSP Header
app.Use(async (context, next) =>
{
    context.Response.Headers.Append(
        "Content-Security-Policy",
        "default-src 'self'; " +
        "script-src 'self'; " +
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
        "img-src 'self' data: https:; " +
        "font-src 'self' https://fonts.gstatic.com; " +
        "connect-src 'self'; " +
        "frame-ancestors 'none';"
    );
    await next();
});

app.UseCors("frontend");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();


app.Run();
