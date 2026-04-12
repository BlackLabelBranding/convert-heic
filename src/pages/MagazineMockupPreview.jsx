useEffect(() => {
  async function load() {
    // 1. Fetch the project
    const { data: projectData } = await supabase
      .from("magazine_projects")
      .select("*")
      .eq("id", projectId)
      .single();

    // 2. CHECK THE SHARE STATUS
    // Assuming your column is named 'is_public' or 'share_enabled'
    // If it's private, we check if the user is a team member as a fallback
    const isPublic = projectData?.is_public === true; 
    
    if (!isPublic) {
      const { data: { user } } = await supabase.auth.getUser();
      // If not public AND no user is logged in, block the data
      if (!user) {
        setProject(null); 
        return;
      }
    }

    // 3. If we made it here, load the pages
    const { data: pageData } = await supabase
      .from("magazine_pages")
      .select("*")
      .eq("project_id", projectId)
      .order("page_number", { ascending: true });

    setProject(projectData || null);
    setPages(pageData || []);
  }

  load();
}, [projectId]);
