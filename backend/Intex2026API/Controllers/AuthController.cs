using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Intex2026API.Data;
using Microsoft.AspNetCore.Authentication.Google;


namespace Intex2026API.Controllers
{
    [ApiController]
    [Route("api/auth")]
    [AllowAnonymous]
    public class AuthController(
        UserManager<ApplicationUser> userManager,
        SignInManager<ApplicationUser> signInManager,
        IConfiguration configuration) : ControllerBase
    {
        public record LoginRequest(string Email, string Password);
        public record RegisterRequest(string Email, string Password);

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest request)
        {
            var user = await userManager.FindByEmailAsync(request.Email);
            if (user == null)
                return Unauthorized(new { message = "Invalid email or password" });

            var result = await signInManager.PasswordSignInAsync(
                user, request.Password, isPersistent: true, lockoutOnFailure: false);

            if (!result.Succeeded)
                return Unauthorized(new { message = "Invalid email or password" });

            var roles = await userManager.GetRolesAsync(user);

            return Ok(new
            {
                isAuthenticated = true,
                userName = user.UserName,
                email = user.Email,
                roles
            });
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterRequest request)
        {
            var user = new ApplicationUser
            {
                UserName = request.Email,
                Email = request.Email
            };

            var result = await userManager.CreateAsync(user, request.Password);
            if (!result.Succeeded)
            {
                var errors = string.Join("; ", result.Errors.Select(e => e.Description));
                return BadRequest(new { message = errors });
            }

            // Auto-assign Donor role to all new registrations
            await userManager.AddToRoleAsync(user, "Donor");

            await signInManager.SignInAsync(user, isPersistent: true);

            var roles = await userManager.GetRolesAsync(user);

            return Ok(new
            {
                isAuthenticated = true,
                userName = user.UserName,
                email = user.Email,
                roles
            });
        }

        [HttpGet("me")]
        public async Task<IActionResult> GetCurrentSession()
        {
            if (User.Identity?.IsAuthenticated != true)
            {
                return Ok(new
                {
                    isAuthenticated = false,
                    userName = (string?)null,
                    email = (string?)null,
                    roles = Array.Empty<string>(),
                });
            }

            var user = await userManager.GetUserAsync(User);
            var roles = User.Claims
                .Where(c => c.Type == ClaimTypes.Role)
                .Select(c => c.Value)
                .Distinct()
                .OrderBy(role => role)
                .ToArray();

            return Ok(new
            {
                isAuthenticated = true,
                userName = user?.UserName ?? User.Identity.Name,
                email = user?.Email,
                roles
            });
        }

        public record ChangePasswordRequest(string CurrentPassword, string NewPassword);

        [HttpPost("change-password")]
        public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequest request)
        {
            if (User.Identity?.IsAuthenticated != true)
                return Unauthorized(new { message = "Not authenticated" });

            var user = await userManager.GetUserAsync(User);
            if (user == null)
                return Unauthorized(new { message = "User not found" });

            var result = await userManager.ChangePasswordAsync(user, request.CurrentPassword, request.NewPassword);
            if (!result.Succeeded)
            {
                var errors = string.Join("; ", result.Errors.Select(e => e.Description));
                return BadRequest(new { message = errors });
            }

            return Ok(new { message = "Password updated successfully" });
        }

        [HttpPost("logout")]
        public async Task<IActionResult> Logout()
        {
            await signInManager.SignOutAsync();
            return Ok(new { message = "Logged out successfully" });
        }

         [HttpGet("providers")]
    public IActionResult GetExternalProviders()
    {
        var providers = new List<object>();

        if (IsGoogleConfigured())
        {
            providers.Add(new
            {
                name = GoogleDefaults.AuthenticationScheme,
                displayName = "Google"
            });
        }

        return Ok(providers);
    }

    [HttpGet("external-login")]
    public IActionResult ExternalLogin(
        [FromQuery] string provider,
        [FromQuery] string? returnPath = null)
    {
        if (!string.Equals(provider, GoogleDefaults.AuthenticationScheme, StringComparison.OrdinalIgnoreCase) ||
            !IsGoogleConfigured())
        {
            return BadRequest(new
            {
                message = "The requested external login provider is not available."
            });
        }

        var callbackUrl = Url.Action(nameof(ExternalLoginCallback), new
        {
            returnPath = NormalizeReturnPath(returnPath)
        });

        if (string.IsNullOrWhiteSpace(callbackUrl))
        {
            return Problem("Unable to create the external login callback URL.");
        }

        var properties = signInManager.ConfigureExternalAuthenticationProperties(
            GoogleDefaults.AuthenticationScheme,
            callbackUrl);

        return Challenge(properties, GoogleDefaults.AuthenticationScheme);
    }

    [HttpGet("external-callback")]
    public async Task<IActionResult> ExternalLoginCallback([FromQuery] string? returnPath = null, [FromQuery] string? remoteError = null)
    {
        if (!string.IsNullOrWhiteSpace(remoteError))
        {
            return Redirect(BuildFrontendErrorUrl("External login failed."));
        }

        var info = await signInManager.GetExternalLoginInfoAsync();

        if (info is null)
        {
            return Redirect(BuildFrontendErrorUrl("External login information was unavailable."));
        }

        var signInResult = await signInManager.ExternalLoginSignInAsync(
            info.LoginProvider,
            info.ProviderKey,
            isPersistent: false,
            bypassTwoFactor: true);

        if (signInResult.Succeeded)
        {
            return Redirect(BuildFrontendSuccessUrl(returnPath));
        }

        var email = info.Principal.FindFirstValue(ClaimTypes.Email) ??
            info.Principal.FindFirstValue("email");

        if (string.IsNullOrWhiteSpace(email))
        {
            return Redirect(BuildFrontendErrorUrl("The external provider did not return an email address."));
        }

        var user = await userManager.FindByEmailAsync(email);

        if (user is null)
        {
            user = new ApplicationUser
            {
                UserName = email,
                Email = email,
                EmailConfirmed = true
            };

            var createUserResult = await userManager.CreateAsync(user);

            if (!createUserResult.Succeeded)
            {
                return Redirect(BuildFrontendErrorUrl("Unable to create a local account for the external login."));
            }

            await userManager.AddToRoleAsync(user, "Donor");
        }

        var addLoginResult = await userManager.AddLoginAsync(user, info);

        if (!addLoginResult.Succeeded)
        {
            return Redirect(BuildFrontendErrorUrl("Unable to associate the external login with the local account."));
        }

        await signInManager.SignInAsync(user, isPersistent: false, info.LoginProvider);
        return Redirect(BuildFrontendSuccessUrl(returnPath));
    }

    // ── Helper methods ───────────────────────────────────────────────

    private bool IsGoogleConfigured()
    {
        var clientId = configuration["Authentication:Google:ClientId"];
        var clientSecret = configuration["Authentication:Google:ClientSecret"];
        return !string.IsNullOrWhiteSpace(clientId) && !string.IsNullOrWhiteSpace(clientSecret);
    }

    private string GetFrontendOrigin()
    {
        var origins = configuration.GetSection("AllowedOrigins").Get<string[]>();
        return origins?.FirstOrDefault() ?? "http://localhost:3000";
    }

    private string BuildFrontendSuccessUrl(string? returnPath)
    {
        var path = NormalizeReturnPath(returnPath);
        return $"{GetFrontendOrigin()}{path}";
    }

    private string BuildFrontendErrorUrl(string message)
    {
        var encoded = Uri.EscapeDataString(message);
        return $"{GetFrontendOrigin()}/login?error={encoded}";
    }

    private static string NormalizeReturnPath(string? returnPath)
    {
        if (string.IsNullOrWhiteSpace(returnPath) || !returnPath.StartsWith('/'))
            return "/";
        return returnPath;
    }
    }
}
