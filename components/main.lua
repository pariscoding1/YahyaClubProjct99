--[[
    Nerd ProgressBar
    Client-side logic

    Made by Nerd Developer (Nerd Team) - Sultan
    Free to use & modify for RP servers.
    Keep the Nerd Developer credit and do NOT resell or rebrand as your own.

    Features:
      - Modern & legacy qb-progressbar compatible API
      - Segmented bar UI with percent + time left
      - Can-cancel with ESC or programmatically
      - Control disables (movement / car / mouse / combat)
      - Optional animation & props (like qb-progressbar)
      - Optional useWhileDead support
]]

local QBCore = nil
if GetResourceState('qb-core') ~= 'missing' then
    pcall(function()
        QBCore = exports['qb-core']:GetCoreObject()
    end)
end

local NerdPB = {
    Debug            = false,           -- لو تبغى تشوف لوق في الكونسول، خله true
    DefaultLabel     = 'Processing...',
    DefaultIcon      = 'fa-leaf',
    DefaultDuration  = 3000,            -- ms
    DefaultDisables  = { combat = true }
}

local active          = false
local cancelled       = false
local endAt           = 0
local canCancel       = true
local disable         = NerdPB.DefaultDisables
local allowWhileDead  = false
local cbFinish, cbCancel = nil, nil

-- animation / props state
local currentAnim     = nil
local currentScenario = nil
local currentProps    = {}

-------------------------------------------------
-- helpers
-------------------------------------------------

local function DebugLog(msg)
    if NerdPB.Debug then
        print(('[Nerd ProgressBar] %s'):format(msg))
    end
end

local function LoadAnimDict(dict)
    if not dict or dict == '' then return false end
    if HasAnimDictLoaded(dict) then return true end
    RequestAnimDict(dict)
    local timeout = GetGameTimer() + 5000
    while not HasAnimDictLoaded(dict) do
        Wait(10)
        if GetGameTimer() > timeout then
            DebugLog('Failed to load anim dict: '..dict)
            return false
        end
    end
    return true
end

local function ClearProps()
    for _, obj in ipairs(currentProps) do
        if DoesEntityExist(obj) then
            DeleteObject(obj)
        end
    end
    currentProps = {}
end

local function StopAnimation()
    local ped = PlayerPedId()

    if currentScenario then
        ClearPedTasks(ped)
        currentScenario = nil
    end

    if currentAnim then
        ClearPedSecondaryTask(ped)
        ClearPedTasks(ped)
        currentAnim = nil
    end

    ClearProps()
end

local function PlayAnimation(animData, propData1, propData2)
    local ped = PlayerPedId()

    if not animData then return end

    -- Scenario mode (مثل qb-progressbar)
    if animData.scenario then
        local scenario = animData.scenario
        currentScenario = scenario
        TaskStartScenarioInPlace(ped, scenario, 0, true)
    elseif animData.animDict and animData.anim then
        -- Dict/Anim mode
        if LoadAnimDict(animData.animDict) then
            local flags = animData.flags or 49
            TaskPlayAnim(
                ped,
                animData.animDict,
                animData.anim,
                8.0, -8.0,
                -1,
                flags,
                0.0,
                false, false, false
            )
            currentAnim = {
                dict = animData.animDict,
                anim = animData.anim
            }
        end
    end

    -- Props (نفس فكرة qb-progressbar)
    local function attachProp(onePropData)
        if not onePropData or not onePropData.model then return end

        local model = joaat(onePropData.model)
        RequestModel(model)
        local timeout = GetGameTimer() + 5000
        while not HasModelLoaded(model) do
            Wait(10)
            if GetGameTimer() > timeout then
                DebugLog('Failed to load prop model: '..tostring(onePropData.model))
                return
            end
        end

        local ped = PlayerPedId()
        local pedCoords = GetEntityCoords(ped)
        local obj = CreateObject(model, pedCoords.x, pedCoords.y, pedCoords.z + 0.2, true, true, false)

        local bone = onePropData.bone or 60309 -- hand
        local pos  = onePropData.pos or vector3(0.0, 0.0, 0.0)
        local rot  = onePropData.rot or vector3(0.0, 0.0, 0.0)

        AttachEntityToEntity(
            obj,
            ped,
            GetPedBoneIndex(ped, bone),
            pos.x, pos.y, pos.z,
            rot.x, rot.y, rot.z,
            true, true, false, true, 1, true
        )

        table.insert(currentProps, obj)
    end

    attachProp(propData1)
    attachProp(propData2)
end

local function setDisables(d)
    if not d then return end

    -- player movement
    if d.move or d.disableMovement then
        DisableControlAction(0, 21, true) -- sprint
        DisableControlAction(0, 22, true) -- jump
        DisableControlAction(0, 30, true) -- move left/right
        DisableControlAction(0, 31, true) -- move fwd/back
    end

    -- vehicle movement
    if d.car or d.disableCarMovement then
        DisableControlAction(0, 63, true) -- veh turn left
        DisableControlAction(0, 64, true) -- veh turn right
        DisableControlAction(0, 71, true) -- veh accel
        DisableControlAction(0, 72, true) -- veh brake
    end

    -- mouse look
    if d.mouse or d.disableMouse then
        DisableControlAction(0, 1, true)
        DisableControlAction(0, 2, true)
    end

    -- combat
    if d.combat ~= false and d.disableCombat ~= false then
        DisablePlayerFiring(PlayerId(), true)
        DisableControlAction(0, 24, true) -- attack
        DisableControlAction(0, 25, true) -- aim
    end
end

local function openUI(opts)
    SendNUIMessage({
        action      = 'open',
        label       = opts.label or NerdPB.DefaultLabel,
        duration    = opts.duration or NerdPB.DefaultDuration,
        icon        = opts.icon or NerdPB.DefaultIcon,  -- FontAwesome class
        showPercent = (opts.showPercent ~= false),
        canCancel   = (opts.canCancel ~= false)
    })
end

local function closeUI(success)
    SendNUIMessage({
        action  = 'close',
        success = success and true or false
    })
end

-------------------------------------------------
-- main loop
-------------------------------------------------

CreateThread(function()
    while true do
        if active then
            if canCancel and IsControlJustPressed(0, 200) then -- ESC
                cancelled = true
            end

            setDisables(disable)

            if GetGameTimer() >= endAt then
                active = false
                closeUI(not cancelled)

                -- نوقف الانيميشن/البروب مهما كان
                StopAnimation()

                if cancelled then
                    if cbCancel then
                        DebugLog('Progress cancelled (callback)')
                        cbCancel()
                    end
                else
                    if cbFinish then
                        DebugLog('Progress finished (callback)')
                        cbFinish()
                    end
                end
            end

            Wait(0)
        else
            Wait(250)
        end
    end
end)

-------------------------------------------------
-- Exports
-------------------------------------------------

exports('IsActive', function()
    return active
end)

exports('Cancel', function()
    if active then
        DebugLog('Cancel called by script')
        cancelled = true
    end
end)

--[[
    Modern usage:

    exports['nerd-progressbar']:Progress({
        label       = 'Repairing vehicle...',
        duration    = 8000,
        icon        = 'fa-wrench',
        canCancel   = true,
        useWhileDead = false,
        disable     = { move = true, car = true, combat = true },

        animation = {
            animDict = 'amb@world_human_hammering@male@base',
            anim     = 'base',
            flags    = 49
        },

        prop = {
            model = 'prop_tool_hammer',
            bone  = 57005,
            pos   = vec3(0.12, 0.01, -0.02),
            rot   = vec3(80.0, 20.0, 10.0)
        }
    }, function()
        -- on finish
    end)

    Legacy (qb-progressbar compatible):

    exports['nerd-progressbar']:Progress(
        'taskName',                          -- a
        'Repairing vehicle...',              -- b label
        8000,                                -- c duration
        false,                               -- d useWhileDead
        true,                                -- e canCancel
        { disableMovement = true, disableCarMovement = true, disableCombat = true }, -- f disables
        { animDict = 'xxx', anim = 'xxx', flags = 49 },                              -- g animation
        { model = 'prop_x', bone = 57005 },                                          -- h prop
        nil,                                                                        -- i propTwo
        function() end,                                                             -- j onFinish
        function() end                                                              -- k onCancel
    )
]]

exports('Progress', function(a, b, c, d, e, f, g, h, i, j, k)
    if active then
        DebugLog('Progress called while active - returning cancel to caller')
        -- لو سكربت ثاني حاول يشغل بروقسبار وهو شغال، نرجع لهم cancel على طول
        if type(b) == 'function' then b(true) end             -- modern: cb in b
        if type(j) == 'function' then j(true) end             -- legacy: onFinish
        if type(k) == 'function' then k(true) end             -- legacy: onCancel
        return
    end

    local label, duration, icon
    local animData, prop1, prop2

    cancelled      = false
    cbFinish       = nil
    cbCancel       = nil
    canCancel      = true
    disable        = NerdPB.DefaultDisables
    allowWhileDead = false

    -- modern: table-based
    if type(a) == 'table' then
        local data = a

        label        = data.label or NerdPB.DefaultLabel
        duration     = tonumber(data.duration) or NerdPB.DefaultDuration
        icon         = data.icon or NerdPB.DefaultIcon
        canCancel    = data.canCancel ~= false
        disable      = data.disable or data.controlDisables or NerdPB.DefaultDisables
        allowWhileDead = data.useWhileDead == true

        animData     = data.animation
        prop1        = data.prop
        prop2        = data.propTwo

        cbFinish     = data.onFinish or b
        cbCancel     = data.onCancel or nil

    else
        -- legacy (qb-progressbar style)
        label        = b or NerdPB.DefaultLabel
        duration     = tonumber(c) or NerdPB.DefaultDuration
        allowWhileDead = d == true
        canCancel    = e ~= false
        disable      = f or NerdPB.DefaultDisables

        animData     = g
        prop1        = h
        prop2        = i

        cbFinish     = j
        cbCancel     = k
        icon         = NerdPB.DefaultIcon
    end

    local ped = PlayerPedId()
    if not allowWhileDead and IsEntityDead(ped) then
        DebugLog('Attempted to start progress while dead (blocked)')
        if QBCore then
            QBCore.Functions.Notify('You cannot do this while dead.', 'error', 2500)
        end
        return
    end

    if duration <= 0 then
        DebugLog('Invalid duration, forcing 1 ms')
        duration = 1
    end

    active = true
    endAt  = GetGameTimer() + duration

    DebugLog(('Progress start: label="%s", duration=%d'):format(label, duration))

    -- شغّل الانيميشن والبروب لو فيه
    PlayAnimation(animData, prop1, prop2)

    openUI({
        label       = label,
        duration    = duration,
        icon        = icon,
        showPercent = true,
        canCancel   = canCancel
    })
end)
