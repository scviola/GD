Method	Endpoint	                    Access	        Description
POST	/api/auth/register	            Public	        Employee self-registration
POST	/api/auth/login	                Public	        Returns JWT
GET	    /api/task-logs	                Employee	    View own logs (filtered by date)
POST	/api/task-logs	                Employee	    Log new work instance
GET	    /api/dashboard/master-schedule	Admin	        Excel-like view with filters
GET	    /api/dashboard/analytics	    Admin	        Aggregated charts data
POST	/api/projects                   Admin	        Create new project
