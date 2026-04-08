using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Intex2026API.Controllers
{
    [ApiController]
    [Route("api/admin/users")]
    [Authorize(Roles = "Admin")]
    public class AdminUsersController(
        UserManager<ApplicationUser> userManager) : ControllerBase
    {
        public record UserListItem(string Id, string Email, string Role);

        public record UserListResponse(List<UserListItem> Items, int Total, int Page, int PageSize);

        public record CreateUserRequest(string Email, string Password, string Role);

        public record UpdateUserRequest(string Email, string Role);

        private static readonly string[] ValidRoles = ["Admin", "Worker", "Donor"];

        private string? GetCurrentUserId() =>
            User.FindFirstValue(ClaimTypes.NameIdentifier);

        [HttpGet]
        public async Task<ActionResult<UserListResponse>> GetUsers(
            int page = 1, int pageSize = 20, string? search = null, string? role = null)
        {
            var users = userManager.Users.AsQueryable();

            if (!string.IsNullOrWhiteSpace(search))
            {
                var s = search.ToLower();
                users = users.Where(u => u.Email != null && u.Email.ToLower().Contains(s));
            }

            // Get total before pagination
            var allUsers = await users.OrderBy(u => u.Email)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            // If role filter specified, we need to filter after fetching (Identity stores roles separately)
            var items = new List<UserListItem>();
            foreach (var u in allUsers)
            {
                var roles = await userManager.GetRolesAsync(u);
                var primaryRole = roles.FirstOrDefault() ?? "None";

                if (!string.IsNullOrWhiteSpace(role) &&
                    !string.Equals(primaryRole, role, StringComparison.OrdinalIgnoreCase))
                    continue;

                items.Add(new UserListItem(u.Id, u.Email ?? "", primaryRole));
            }

            // For total count with role filter, we need the full count
            int total;
            if (!string.IsNullOrWhiteSpace(role))
            {
                // Count all matching users with this role
                var allFiltered = userManager.Users.AsQueryable();
                if (!string.IsNullOrWhiteSpace(search))
                {
                    var s = search.ToLower();
                    allFiltered = allFiltered.Where(u => u.Email != null && u.Email.ToLower().Contains(s));
                }
                var allList = await allFiltered.ToListAsync();
                total = 0;
                foreach (var u in allList)
                {
                    var roles = await userManager.GetRolesAsync(u);
                    if (roles.Any(r => string.Equals(r, role, StringComparison.OrdinalIgnoreCase)))
                        total++;
                }
            }
            else
            {
                var countQuery = userManager.Users.AsQueryable();
                if (!string.IsNullOrWhiteSpace(search))
                {
                    var s = search.ToLower();
                    countQuery = countQuery.Where(u => u.Email != null && u.Email.ToLower().Contains(s));
                }
                total = await countQuery.CountAsync();
            }

            return Ok(new UserListResponse(items, total, page, pageSize));
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetUser(string id)
        {
            var user = await userManager.FindByIdAsync(id);
            if (user == null) return NotFound(new { message = "User not found" });

            var roles = await userManager.GetRolesAsync(user);

            return Ok(new UserListItem(user.Id, user.Email ?? "", roles.FirstOrDefault() ?? "None"));
        }

        [HttpPost]
        public async Task<IActionResult> CreateUser([FromBody] CreateUserRequest request)
        {
            if (!ValidRoles.Contains(request.Role))
                return BadRequest(new { message = $"Invalid role. Must be one of: {string.Join(", ", ValidRoles)}" });

            var existing = await userManager.FindByEmailAsync(request.Email);
            if (existing != null)
                return BadRequest(new { message = "A user with this email already exists." });

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

            await userManager.AddToRoleAsync(user, request.Role);

            return Ok(new UserListItem(user.Id, user.Email ?? "", request.Role));
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateUser(string id, [FromBody] UpdateUserRequest request)
        {
            var currentUserId = GetCurrentUserId();
            if (string.Equals(id, currentUserId, StringComparison.OrdinalIgnoreCase))
                return BadRequest(new { message = "You cannot edit your own account." });

            if (!ValidRoles.Contains(request.Role))
                return BadRequest(new { message = $"Invalid role. Must be one of: {string.Join(", ", ValidRoles)}" });

            var user = await userManager.FindByIdAsync(id);
            if (user == null) return NotFound(new { message = "User not found" });

            // Update email
            if (!string.Equals(user.Email, request.Email, StringComparison.OrdinalIgnoreCase))
            {
                var existing = await userManager.FindByEmailAsync(request.Email);
                if (existing != null && existing.Id != user.Id)
                    return BadRequest(new { message = "A user with this email already exists." });

                user.Email = request.Email;
                user.UserName = request.Email;
                var updateResult = await userManager.UpdateAsync(user);
                if (!updateResult.Succeeded)
                {
                    var errors = string.Join("; ", updateResult.Errors.Select(e => e.Description));
                    return BadRequest(new { message = errors });
                }
            }

            // Update role
            var currentRoles = await userManager.GetRolesAsync(user);
            if (!currentRoles.Contains(request.Role))
            {
                await userManager.RemoveFromRolesAsync(user, currentRoles);
                await userManager.AddToRoleAsync(user, request.Role);
            }

            return Ok(new UserListItem(user.Id, user.Email ?? "", request.Role));
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteUser(string id)
        {
            var currentUserId = GetCurrentUserId();
            if (string.Equals(id, currentUserId, StringComparison.OrdinalIgnoreCase))
                return BadRequest(new { message = "You cannot delete your own account." });

            var user = await userManager.FindByIdAsync(id);
            if (user == null) return NotFound(new { message = "User not found" });

            var result = await userManager.DeleteAsync(user);
            if (!result.Succeeded)
            {
                var errors = string.Join("; ", result.Errors.Select(e => e.Description));
                return BadRequest(new { message = errors });
            }

            return Ok(new { message = "User deleted successfully" });
        }
    }
}
