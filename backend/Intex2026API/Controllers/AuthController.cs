using System.Security.Claims;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Intex2026API.Data;

namespace Intex2026API.Controllers
{
    [ApiController]
    [Route("api/auth")]
    public class AuthController(
        UserManager<ApplicationUser> userManager,
        SignInManager<ApplicationUser> signInManager) : ControllerBase
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

            return Ok(new
            {
                isAuthenticated = true,
                userName = user.UserName,
                email = user.Email,
                roles = Array.Empty<string>()
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

            await signInManager.SignInAsync(user, isPersistent: true);

            return Ok(new
            {
                isAuthenticated = true,
                userName = user.UserName,
                email = user.Email,
                roles = Array.Empty<string>()
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

        [HttpPost("logout")]
        public async Task<IActionResult> Logout()
        {
            await signInManager.SignOutAsync();
            return Ok(new { message = "Logged out successfully" });
        }
    }
}
