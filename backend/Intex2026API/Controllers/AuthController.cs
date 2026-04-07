using System.Security.Claims;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Intex2026API.Data;

namespace Intex2026API.Controllers

{
    [ApiController]
    [Route("api/auth")]
    public class AuthController(UserManager<ApplicationUser> userManager, SignInManager<ApplicationUser> signInManager) : ControllerBase
    {
        [HttpGet("me")]
        public async Task<ActionResult> GetCurrentSession()
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

                return Ok(new { message = "logged out succesfully" });

            }
        }
    }
}