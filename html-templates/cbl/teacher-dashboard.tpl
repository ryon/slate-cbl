{extends designs/site.tpl}

{block "css"}
    {cssmin fonts/font-awesome.css}
    <link rel="stylesheet" type="text/css" href="{Sencha_App::getByName('CompetencyTracker')->getVersionedPath('build/production/resources/CompetencyTracker-all.css')}" />

    {$dwoo.parent}
{/block}

{block content}
    <header class="page-header">
        <div class="header-buttons">
            <button type="button" class="primary" data-action="demonstration-create">Log a Demonstration</button>
        </div>

        <form method="GET" class="inline-fields">
            {capture assign=studioSelect}
                <select name="students" onchange="this.form.submit()" disabled>
                    <option>-select-</option>
                </select>
            {/capture}
            {labeledField html=$studioSelect type=select label=Group}
            
            {capture assign=contentAreaSelect}
                <select name="content-area" onchange="this.form.submit()">
                    <option value="">-select-</option>
                    {foreach item=availableArea from=Slate\CBL\ContentArea::getAll()}
                        <option value="{$availableArea->Code}" {refill field=content-area selected=$availableArea->Code}>{$availableArea->Title|escape}</option>
                    {/foreach}
                </select>
            {/capture}
            {labeledField html=$contentAreaSelect type=select label="Content Area"}
        </form>
    </header>

    <div id='teacherDashboardCt'>Loading competency tracker &mdash; teacher dashboard&hellip;</div>
{/block}

{block js-bottom}
    <script type="text/javascript">
        var SiteEnvironment = SiteEnvironment || { };
        SiteEnvironment.user = {$.User->getData()|json_encode};
        SiteEnvironment.cblStudents = {JSON::translateObjects($students, true)|json_encode};
        SiteEnvironment.cblContentArea = {JSON::translateObjects($ContentArea)|json_encode};
    </script>

    {$dwoo.parent}

    {if $.get.jsdebug}
        {sencha_bootstrap patchLoader=false packages=array('slate-cbl', 'slate-theme')}
    {else}
        <script src="{Site::getVersionedRootUrl('js/pages/TeacherCompetencyDashboard.js')}"></script>
    {/if}
    
    {jsmin "markdown.js"}

    <script>
        Ext.require('Site.page.TeacherCompetencyDashboard');
    </script>
{/block}