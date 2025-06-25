"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"

interface TaskCreationModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (taskData: any) => void
  task?: any
  loading?: boolean
}

export default function TaskCreationModal({ isOpen, onClose, onSubmit, task, loading }: TaskCreationModalProps) {
  const [formData, setFormData] = useState({
    title: task?.title || "",
    description: task?.description || "",
    reward_amount: task?.reward_amount || 0.5,
    task_type: task?.task_type || "survey",
    provider: task?.provider || "internal",
    url: task?.url || "",
    image_url: task?.image_url || "",
    daily_limit: task?.daily_limit || 1,
    total_limit: task?.total_limit || 100,
    difficulty: task?.difficulty || "easy",
    estimated_time: task?.estimated_time || "5 minutes",
    is_active: task?.is_active ?? true,
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{task ? "Edit Task" : "Create New Task"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="title">Task Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleInputChange("title", e.target.value)}
                placeholder="Enter task title"
                required
              />
            </div>

            <div>
              <Label htmlFor="provider">Provider</Label>
              <Input
                id="provider"
                value={formData.provider}
                onChange={(e) => handleInputChange("provider", e.target.value)}
                placeholder="e.g., Internal, Survey Provider"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              placeholder="Describe what users need to do"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="reward_amount">Reward Amount ($) *</Label>
              <Input
                id="reward_amount"
                type="number"
                step="0.01"
                min="0"
                value={formData.reward_amount}
                onChange={(e) => handleInputChange("reward_amount", Number.parseFloat(e.target.value))}
                required
              />
            </div>

            <div>
              <Label htmlFor="task_type">Task Type</Label>
              <Select value={formData.task_type} onValueChange={(value) => handleInputChange("task_type", value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="survey">Survey</SelectItem>
                  <SelectItem value="video">Watch Video</SelectItem>
                  <SelectItem value="app_install">App Install</SelectItem>
                  <SelectItem value="signup">Sign Up</SelectItem>
                  <SelectItem value="social_media">Social Media</SelectItem>
                  <SelectItem value="quiz">Quiz</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="difficulty">Difficulty</Label>
              <Select value={formData.difficulty} onValueChange={(value) => handleInputChange("difficulty", value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">Easy</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="hard">Hard</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="daily_limit">Daily Limit</Label>
              <Input
                id="daily_limit"
                type="number"
                min="1"
                value={formData.daily_limit}
                onChange={(e) => handleInputChange("daily_limit", Number.parseInt(e.target.value))}
              />
            </div>

            <div>
              <Label htmlFor="total_limit">Total Limit</Label>
              <Input
                id="total_limit"
                type="number"
                min="1"
                value={formData.total_limit}
                onChange={(e) => handleInputChange("total_limit", Number.parseInt(e.target.value))}
              />
            </div>

            <div>
              <Label htmlFor="estimated_time">Estimated Time</Label>
              <Input
                id="estimated_time"
                value={formData.estimated_time}
                onChange={(e) => handleInputChange("estimated_time", e.target.value)}
                placeholder="e.g., 5 minutes"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="url">Task URL</Label>
            <Input
              id="url"
              type="url"
              value={formData.url}
              onChange={(e) => handleInputChange("url", e.target.value)}
              placeholder="https://example.com/task"
            />
          </div>

          <div>
            <Label htmlFor="image_url">Image URL</Label>
            <Input
              id="image_url"
              type="url"
              value={formData.image_url}
              onChange={(e) => handleInputChange("image_url", e.target.value)}
              placeholder="https://example.com/image.jpg"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) => handleInputChange("is_active", checked)}
            />
            <Label htmlFor="is_active">Active Task</Label>
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? "Saving..." : task ? "Update Task" : "Create Task"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
